"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * A component for embedding content with a desired aspect ratio.
 * Built on top of Radix UI's Aspect Ratio primitive.
 * @example
 * <AspectRatio ratio={16 / 9} className="bg-muted">
 * <img src="https://example.com/image.jpg" alt="Image" className="rounded-md object-cover" />
 * </AspectRatio>
 */
const AspectRatio = AspectRatioPrimitive.Root;

export { AspectRatio };
