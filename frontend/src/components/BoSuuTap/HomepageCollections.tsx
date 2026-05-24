import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Carousel, Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getHomepageCollections } from "../../services/Product/apiClient";
import type { Products } from "../../services/Product/typing";

const { Title, Text } = Typography;

const HomepageCollections: React.FC = () => {
  const [collections, setCollections] = useState<Products.IHomepageCollections>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const carouselRef = useRef<any>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await getHomepageCollections();
        if (response.data && response.data.data) {
          setCollections(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching homepage collections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const nextSlide = () => carouselRef.current?.next();
  const prevSlide = () => carouselRef.current?.prev();

  const collectionKeys = Object.keys(collections);

  if (loading || collectionKeys.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: "0 30px 80px", marginTop: "0px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <Title level={2} style={{ margin: 0, fontWeight: 900, textTransform: "uppercase" }}>
          Bộ Sưu Tập Nổi Bật
        </Title>
        <Text type="secondary" style={{ fontSize: "16px" }}>
          Khám phá những phong cách mới nhất được chọn lọc dành riêng cho bạn
        </Text>
      </div>

      <div style={{ position: "relative" }}>
        <style>
          {`
            .collections-carousel-wrapper .ant-carousel .slick-dots-bottom {
              bottom: -30px !important;
            }
            .collections-carousel-wrapper .ant-carousel .slick-dots li button {
              background: #000 !important;
              opacity: 0.3 !important; 
            }
            .collections-carousel-wrapper .ant-carousel .slick-dots li.slick-active button {
              background: #000 !important;
              opacity: 0.8 !important;
            }
          `}
        </style>
        <div className="collections-carousel-wrapper" style={{ paddingBottom: "30px" }}>
          <Carousel
            ref={carouselRef}
            dots={true}
            autoplay
            autoplaySpeed={3000}
            slidesToShow={Math.min(2, collectionKeys.length)}
            slidesToScroll={1}
            responsive={[
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                },
              },
            ]}
          >
            {collectionKeys.map((key) => {
              const collection = collections[key];
              let bgImage = "/placeholder.jpg";
              if (collection.products && collection.products.length > 0) {
                const randomProduct = collection.products[Math.floor(Math.random() * collection.products.length)];
                const mainImg = randomProduct.product_images?.find((img) => img.is_main);
                bgImage = mainImg?.image_url || randomProduct.product_images?.[0]?.image_url || bgImage;
              }

              return (
                <div key={key} style={{ padding: "0 12px" }}>
                  <div
                    onClick={() => navigate(`/collections/${key}`)}
                    style={{
                      height: "380px",
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${bgImage}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "12px",
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "40px",
                      color: "#fff",
                      cursor: "pointer",
                      margin: "0 12px",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "36px",
                          fontWeight: 900,
                          lineHeight: 1.1,
                          textShadow: "0 4px 12px rgba(0,0,0,0.7)",
                          margin: 0,
                          color: "#fff"
                        }}
                      >
                        {collection.title}
                      </h2>
                      {collection.subtitle && (
                        <p style={{ fontSize: "16px", marginTop: "8px", opacity: 0.9, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                          {collection.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>

        {/* Navigation Arrows for Carousel */}
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          onClick={prevSlide}
          style={{
            position: "absolute",
            top: "calc(50% - 15px)",
            left: "-20px",
            transform: "translateY(-50%)",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            width: "40px",
            height: "40px",
          }}
        />

        <Button
          shape="circle"
          icon={<RightOutlined />}
          onClick={nextSlide}
          style={{
            position: "absolute",
            top: "calc(50% - 15px)",
            right: "-20px",
            transform: "translateY(-50%)",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            width: "40px",
            height: "40px",
          }}
        />
      </div>
    </div>
  );
};

export default HomepageCollections;
