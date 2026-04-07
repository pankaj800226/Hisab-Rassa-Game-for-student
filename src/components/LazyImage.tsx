import { useEffect, useRef, useState } from "react";

type LazyImageProps = {
    loader: () => Promise<{ default: string }>;
    alt: string;
    className?: string;
    priority?: boolean;
};

const LazyImage: React.FC<LazyImageProps> = ({
    loader,
    alt,
    className,
    priority = false,
}) => {
    const [src, setSrc] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Priority images → instantly load
        if (priority) {
            loader().then((img) => setSrc(img.default));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loader().then((img) => setSrc(img.default));
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [loader, priority]);

    return (
        <div
            ref={containerRef}
            style={{ position: "relative", width: "100%", height: "100%" }}
        >
            {!src && <div className="ag-skeleton" />}

            {src && (
                <img
                    src={src}
                    alt={alt}
                    className={className}
                    loading={priority ? "eager" : "lazy"}
                />
            )}
        </div>
    );
};

export default LazyImage;