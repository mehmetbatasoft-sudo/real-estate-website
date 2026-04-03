'use client';
/**
 * CloudinaryImage.tsx — Client-side wrapper for CldImage
 *
 * next-cloudinary's CldImage uses React hooks internally (useState, useRef)
 * but does not include a 'use client' directive in its package. This wrapper
 * re-exports CldImage as a proper client component so it can be safely
 * imported and rendered from server components.
 *
 * Usage: Replace `import { CldImage } from 'next-cloudinary'` with
 *        `import CloudinaryImage from '@/app/components/CloudinaryImage'`
 *        in any server component that needs Cloudinary images.
 */

import { CldImage } from 'next-cloudinary';

export default CldImage;
