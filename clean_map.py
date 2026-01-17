
import cv2
import numpy as np

# Load the V19 image
input_path = '/Users/davidgaston/.gemini/antigravity/brain/c073cb75-73d9-422e-bbc5-8fe97bb298ad/dark_map_gold_v19_satellite_egypt_uae_fix_1768666326128.png'
output_path = 'assets/gold-presence-map.png'

img = cv2.imread(input_path)

# Convert to HSV
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# Define Gold color range (Yellow/Orange)
# H: 10-40 (approx for gold/yellow), S: > 50, V: > 50
lower_gold = np.array([10, 50, 50])
upper_gold = np.array([40, 255, 255])

# Create a mask for gold areas
mask = cv2.inRange(hsv, lower_gold, upper_gold)

# Soften the mask for better blending
mask_blurred = cv2.GaussianBlur(mask, (5, 5), 0)

# Extract the Gold parts
gold_parts = cv2.bitwise_and(img, img, mask=mask_blurred)

# Create the dark background (Show contours/terrain but remove color lights)
# 1. Convert original to grayscale to kill specific colored lights (like city lights in Russia)
gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 2. Convert back to BGR so we can merge
gray_bgr = cv2.cvtColor(gray_img, cv2.COLOR_GRAY2BGR)
# 3. Dim it but keep it visible (contours/terrain) - e.g. 30% brightness
dark_background = (gray_bgr * 0.35).astype(np.uint8)

# Combine: Where mask is strong, use gold_parts. Where mask is weak, use dark_background.
# We need to broadcast the mask to 3 channels
mask_3ch = cv2.cvtColor(mask_blurred, cv2.COLOR_GRAY2BGR) / 255.0

# Final blend
final_img = (gold_parts * mask_3ch + dark_background * (1 - mask_3ch)).astype(np.uint8)

# Save
cv2.imwrite(output_path, final_img)
# cv2.imwrite('assets/world-map.svg', final_img) # Legacy fallback skipped in python

print("Processed image saved to", output_path)
