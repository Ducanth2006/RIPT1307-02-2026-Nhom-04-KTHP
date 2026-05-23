import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Modal, Button, Slider, message, Spin, Tooltip } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ScissorOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import type { Area } from "react-easy-crop";
import supabase from "../utils/supabaseClient";

// ─── Helpers ────────────────────────────────────────────────────────────────

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.readAsDataURL(file);
  });

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

const uploadToSupabase = async (blob: Blob): Promise<string> => {
  const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error("Upload ảnh thất bại: " + error.message);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductImage {
  image_url: string;
  is_main: boolean;
}

interface Props {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProductImageUploader = ({ value = [], onChange, maxImages = 5 }: Props) => {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");
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
    if (value.length >= maxImages) {
      message.warning(`Tối đa ${maxImages} ảnh!`);
      return;
    }

    const dataUrl = await readFileAsDataURL(file);
    setCurrentSrc(dataUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  /** Xác nhận crop và upload */
  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(currentSrc, croppedAreaPixels);
      const url = await uploadToSupabase(blob);

      // Thêm ảnh mới vào danh sách. Nếu chưa có ảnh nào thì mặc định là ảnh chính.
      const isMain = value.length === 0;
      const updated = [...value, { image_url: url, is_main: isMain }];
      
      onChange(updated);
      setCropModalOpen(false);
      message.success("Tải ảnh lên thành công!");
    } catch (err: any) {
      message.error(err.message || "Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  /** Xóa ảnh */
  const handleRemove = (urlToDelete: string) => {
    const updated = value.filter((img) => img.image_url !== urlToDelete);
    // Nếu xóa ảnh chính thì đặt ảnh đầu tiên còn lại làm ảnh chính
    const hasMain = updated.some((img) => img.is_main);
    if (updated.length > 0 && !hasMain) {
      updated[0].is_main = true;
    }
    onChange(updated);
  };

  /** Đặt làm ảnh chính */
  const handleSetMain = (urlToSet: string) => {
    const updated = value.map((img) => ({
      ...img,
      is_main: img.image_url === urlToSet,
    }));
    onChange(updated);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        {value.map((img) => (
          <div
            key={img.image_url}
            style={{
              position: "relative",
              width: 100,
              height: 100,
              borderRadius: 8,
              overflow: "hidden",
              border: img.is_main ? "2px solid #ee4d2d" : "1px solid #d8dadc",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}
            onClick={() => handleSetMain(img.image_url)}
          >
            <img
              src={img.image_url}
              alt="product"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Label ảnh chính */}
            {img.is_main ? (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "#ee4d2d",
                  color: "#fff",
                  fontSize: 10,
                  textAlign: "center",
                  padding: "2px 0",
                  fontWeight: "bold",
                }}
              >
                Ảnh chính
              </div>
            ) : (
              <div
                className="hover-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
              >
                <span style={{ color: "#fff", fontSize: 10, fontWeight: "medium" }}>
                  Đặt làm ảnh chính
                </span>
              </div>
            )}

            {/* Nút xóa ảnh */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(img.image_url);
              }}
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
                zIndex: 10,
              }}
            >
              <DeleteOutlined />
            </button>
          </div>
        ))}

        {/* Nút thêm ảnh */}
        {value.length < maxImages && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              width: 100,
              height: 100,
              borderRadius: 8,
              border: "1.5px dashed #d9d9d9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              color: "#bbb",
              fontSize: 12,
              gap: 4,
              transition: "border-color 0.2s, color 0.2s",
              userSelect: "none",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#ee4d2d";
                (e.currentTarget as HTMLDivElement).style.color = "#ee4d2d";
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#d9d9d9";
                (e.currentTarget as HTMLDivElement).style.color = "#bbb";
              }
            }}
          >
            {uploading ? (
              <Spin size="small" />
            ) : (
              <>
                <PlusOutlined style={{ fontSize: 20 }} />
                <span>Thêm ảnh</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 12, color: "#aaa" }}>
        Tối đa {maxImages} ảnh · Tỉ lệ crop 1:1 · JPG, PNG · Tối đa 5MB mỗi ảnh
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
            <span>Cắt ảnh sản phẩm (Tỉ lệ 1:1)</span>
          </div>
        }
        onCancel={() => !uploading && setCropModalOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button disabled={uploading} onClick={() => setCropModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleCropConfirm}
              loading={uploading}
              style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
            >
              Cắt & Tải lên
            </Button>
          </div>
        }
        width={520}
        destroyOnClose
        maskClosable={false}
        closable={!uploading}
      >
        {/* Khung crop */}
        <div style={{ position: "relative", width: "100%", height: 340, background: "#1a1a1a", borderRadius: 8, overflow: "hidden" }}>
          <Cropper
            image={currentSrc}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
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
    </div>
  );
};

export default ProductImageUploader;
