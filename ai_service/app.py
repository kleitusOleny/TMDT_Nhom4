import re
import os
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModel, AutoTokenizer
from underthesea import word_tokenize

app = FastAPI(title="CleanMate ABSA AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Danh sách 12 nhãn tương ứng 4 khía cạnh và 3 trạng thái cảm xúc
LABEL_COLS = [
    "Chất lượng_Tích cực", "Chất lượng_Tiêu cực", "Chất lượng_Trung tính",
    "Nhân sự_Tích cực", "Nhân sự_Tiêu cực", "Nhân sự_Trung tính",
    "Giá cả_Tích cực", "Giá cả_Tiêu cực", "Giá cả_Trung tính",
    "Thời gian_Tích cực", "Thời gian_Tiêu cực", "Thời gian_Trung tính"
]

# 2. Định nghĩa kiến trúc CleanMatePhoBERT đúng như trong Notebook
class CleanMatePhoBERT(nn.Module):
    def __init__(self, phobert_model, num_labels=12):
        super(CleanMatePhoBERT, self).__init__()
        self.phobert = phobert_model
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.phobert.config.hidden_size, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)
        return self.classifier(pooled_output)

# 3. Tiền xử lý văn bản tiếng Việt
def preprocess_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return word_tokenize(text, format="text")

# 4. Biến toàn cục cho model & tokenizer
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
tokenizer = None

def get_or_load_model():
    global model, tokenizer
    if model is not None and tokenizer is not None:
        return model, tokenizer

    MODEL_NAME = "vinai/phobert-base"
    # Tìm đường dẫn checkpoint .pth
    possible_paths = [
        os.path.abspath("cleanmate_phobert_v1.pth"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cleanmate_phobert_v1.pth")),
        os.path.abspath("cleanmate_model.pth")
    ]
    weight_path = None
    for p in possible_paths:
        if os.path.exists(p):
            weight_path = p
            break

    if not weight_path:
        raise FileNotFoundError("Không tìm thấy file trọng số cleanmate_phobert_v1.pth")

    print(f"[AI] Đang nạp tokenizer & model backbone {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    phobert = AutoModel.from_pretrained(MODEL_NAME)

    print(f"[AI] Đang nạp weights từ: {weight_path}...")
    model_instance = CleanMatePhoBERT(phobert, num_labels=len(LABEL_COLS))
    state_dict = torch.load(weight_path, map_location=device, weights_only=False)
    model_instance.load_state_dict(state_dict)
    model_instance.to(device)
    model_instance.eval()

    model = model_instance
    print("[AI] Sẵn sàng phân loại cảm xúc theo khía cạnh!")
    return model, tokenizer

class PredictRequest(BaseModel):
    text: str
    threshold: float = 0.45

@app.get("/health")
def health_check():
    return {"status": "ok", "device": str(device)}

@app.post("/predict")
def predict_aspect_sentiment(req: PredictRequest):
    if not req.text or not req.text.strip():
        return {"text": req.text, "predictions": []}

    try:
        cur_model, cur_tokenizer = get_or_load_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    clean_text = preprocess_text(req.text)
    encoding = cur_tokenizer(
        clean_text,
        add_special_tokens=True,
        max_length=256,
        padding="max_length",
        truncation=True,
        return_attention_mask=True,
        return_tensors="pt"
    )

    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)

    with torch.no_grad():
        outputs = cur_model(input_ids, attention_mask)
        probs = torch.sigmoid(outputs).squeeze(0)

    sentiment_map = {
        "Tích cực": "POSITIVE",
        "Tiêu cực": "NEGATIVE",
        "Trung tính": "NEUTRAL"
    }

    results = []
    # Thu thập các khía cạnh đạt ngưỡng
    for idx, prob in enumerate(probs):
        score = float(prob.item())
        if score >= req.threshold:
            raw_label = LABEL_COLS[idx]
            aspect, sent_vn = raw_label.split("_")
            results.append({
                "aspect": aspect,
                "sentiment": sentiment_map.get(sent_vn, "NEUTRAL"),
                "confidence": round(score, 3),
                "highlightText": req.text
            })

    # Nếu không có nhãn nào vượt ngưỡng, chọn nhãn có xác suất cao nhất
    if not results:
        best_idx = int(torch.argmax(probs).item())
        best_score = float(probs[best_idx].item())
        raw_label = LABEL_COLS[best_idx]
        aspect, sent_vn = raw_label.split("_")
        results.append({
            "aspect": aspect,
            "sentiment": sentiment_map.get(sent_vn, "NEUTRAL"),
            "confidence": round(best_score, 3),
            "highlightText": req.text
        })

    return {"text": req.text, "predictions": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
