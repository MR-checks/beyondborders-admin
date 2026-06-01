from PIL import Image

img_path = 'favicon/icon.png'
img = Image.open(img_path).convert('RGBA')
width, height = img.size
cx, cy = width / 2, height / 2

pixels = img.load()

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        dist = ((x - cx)**2 + (y - cy)**2)**0.5
        
        # If the pixel is further than 232 from center and it is not the dark brown background
        # Dark brown is roughly R<50, G<30, B<20. Golden is R>100.
        if dist > 232 and a > 0:
            if r > 50: # It's part of the golden edge
                pixels[x, y] = (255, 255, 255, a)

# Save the original size as app/icon.png so Next.js uses it
img.save('app/icon.png')
print("Saved to app/icon.png")

