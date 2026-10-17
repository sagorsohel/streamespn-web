'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { getOptimizedImageUrl, ImageSizeVariant } from '@/lib/imageUtils';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  alt: string;
  sizeVariant?: ImageSizeVariant;
  fallback?: React.ReactNode;
}

export function OptimizedImage({
  src,
  alt = '',
  sizeVariant = 'tiny',
  fallback = null,
  className = '',
  width,
  height,
  fill,
  ...rest
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  const optimizedSrc = getOptimizedImageUrl(src, sizeVariant);

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={!fill ? (width ?? 48) : undefined}
      height={!fill ? (height ?? 48) : undefined}
      fill={fill}
      className={className}
      loading={rest.priority ? undefined : 'lazy'}
      decoding="async"
      style={{
        ...(!fill && width ? { maxWidth: '100%', height: 'auto' } : {}),
        ...(!fill && width && height ? { aspectRatio: `${width} / ${height}` } : {}),
        ...rest.style,
      }}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
}

export default OptimizedImage;
