import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Modal, Button, Slider, Upload, message, Spin } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import type { Area } from "react-easy-crop";
import supabase from "../utils/supabaseClient";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Chuyển file thành objectURL để preview */
const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.readAsDataURL(file);
  });

/** Crop ảnh từ canvas dựa theo pixelCrop */
const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas is empty"));
        resolve(blob);
      }, "image/jpeg", 0.85);
    });
    image.src = imageSrc;
  });

// ─── Upload lên Supabase Storage ─────────────────────────────────────────────

const uploadToSupabase = async (blob: Blob, userId: number): Promise<string> => {
  const fileName = `complaints/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from("complaint-images")
    .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error("Upload ảnh thất bại: " + error.message);

  const { data } = supabase.storage
    .from("complaint-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageItem {
  uid: string;
  originalSrc: string;   // DataURL của file gốc
  croppedSrc: string;    // DataURL sau khi crop (để preview)
  croppedBlob: Blob;     // Blob để upload
  uploaded: boolean;
  uploadedUrl?: string;
}

interface Props {
  userId: number;
  maxImages?: number;
  onChange?: (urls: string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ImageCropUploader = ({ userId, maxImages = 5, onChange }: Props) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [currentUid, setCurrentUid] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Khi user chọn file */
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Chỉ chấp nhận file ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Ảnh không được vượt quá 5MB!");
      return;
    }
    if (images.length >= maxImages) {
      message.warning(`Tối đa ${maxImages} ảnh!`);
      return;
    }

    const dataUrl = await readFileAsDataURL(file);
    const uid = `img_${Date.now()}`;
    setCurrentSrc(dataUrl);
    setCurrentUid(uid);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  /** Xác nhận crop */
  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(currentSrc, croppedAreaPixels);
      const croppedSrc = URL.createObjectURL(blob);

      const newItem: ImageItem = {
        uid: currentUid,
        originalSrc: currentSrc,
        croppedSrc,
        croppedBlob: blob,
        uploaded: false,
      };

      const updated = [...images, newItem];
      setImages(updated);
      setCropModalOpen(false);

      // Upload ngay sau khi crop
      uploadImage(newItem, updated);
    } catch {
      message.error("Crop ảnh thất bại.");
    }
  };

  /** Upload ảnh lên Supabase */
  const uploadImage = async (item: ImageItem, currentImages: ImageItem[]) => {
    setUploading(true);
    try {
      const url = await uploadToSupabase(item.croppedBlob, userId);
      const updated = currentImages.map((img) =>
        img.uid === item.uid ? { ...img, uploaded: true, uploadedUrl: url } : img
      );
      setImages(updated);
      onChange?.(updated.filter((i) => i.uploadedUrl).map((i) => i.uploadedUrl!));
      message.success("Ảnh đã được thêm!");
    } catch (err: any) {
      message.error(err.message || "Upload thất bại.");
      // Xóa item lỗi
      const updated = currentImages.filter((img) => img.uid !== item.uid);
      setImages(updated);
    } finally {
      setUploading(false);
    }
  };

  /** Xóa ảnh */
  const handleRemove = (uid: string) => {
    const updated = images.filter((img) => img.uid !== uid);
    setImages(updated);
    onChange?.(updated.filter((i) => i.uploadedUrl).map((i) => i.uploadedUrl!));
  };

  return (
    <div>
      {/* Lưới ảnh preview */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {images.map((img) => (
          <div
            key={img.uid}
            style={{
              position: "relative",
              width: 90,
              height: 90,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={img.croppedSrc}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Overlay loading */}
            {!img.uploaded && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="small" />
              </div>
            )}
            {/* Nút xóa */}
            {img.uploaded && (
              <button
                onClick={() => handleRemove(img.uid)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                }}
              >
                <DeleteOutlined />
              </button>
            )}
          </div>
        ))}

        {/* Nút thêm ảnh */}
        {images.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90,
              height: 90,
              borderRadius: 8,
              border: "1.5px dashed #d9d9d9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#bbb",
              fontSize: 12,
              gap: 4,
              transition: "border-color 0.2s, color 0.2s",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#ee4d2d";
              (e.currentTarget as HTMLDivElement).style.color = "#ee4d2d";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#d9d9d9";
              (e.currentTarget as HTMLDivElement).style.color = "#bbb";
            }}
          >
            <PlusOutlined style={{ fontSize: 20 }} />
            <span>Thêm ảnh</span>
          </div>
        )}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 12, color: "#aaa" }}>
        Tối đa {maxImages} ảnh · JPG, PNG · Tối đa 5MB mỗi ảnh
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      {/* Modal crop */}
      <Modal
        open={cropModalOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScissorOutlined style={{ color: "#ee4d2d" }} />
            <span>Cắt ảnh</span>
          </div>
        }
        onCancel={() => setCropModalOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setCropModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleCropConfirm}
              loading={uploading}
              style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
            >
              Xác nhận
            </Button>
          </div>
        }
        width={520}
        destroyOnClose
      >
        {/* Khung crop */}
        <div style={{ position: "relative", width: "100%", height: 340, background: "#1a1a1a", borderRadius: 8, overflow: "hidden" }}>
          <Cropper
            image={currentSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Thanh zoom */}
        <div style={{ marginTop: 20, padding: "0 8px" }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Zoom</div>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(val) => setZoom(val)}
            trackStyle={{ backgroundColor: "#ee4d2d" }}
            handleStyle={{ borderColor: "#ee4d2d" }}
          />
        </div>
      </Modal>

      {/* Dummy Upload để tránh antd warning nếu dùng trong Form */}
      <Upload style={{ display: "none" }} />
    </div>
  );
};

export default ImageCropUploader;
