import { useState } from "react";

interface NewsImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

export const NewsImage = ({ src, alt, className, fallbackSrc, ...props }: NewsImageProps) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Default fallback if none provided
    const defaultFallback = "https://images.unsplash.com/photo-1558494949-ef527443d01d?w=800&q=80";

    const handleError = () => {
        if (!error) {
            setError(true);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-muted ${className}`}>
            <img
                src={error ? (fallbackSrc || defaultFallback) : src}
                alt={alt}
                onError={handleError}
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
                    }`}
                {...props}
            />
            {!loaded && !error && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
        </div>
    );
};
