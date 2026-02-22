from PIL import Image
import sys

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # Check if the pixel is magenta-ish
        # We use a small threshold because AI generation might not be perfectly 255,0,255
        if item[0] > 200 and item[1] < 50 and item[2] > 200:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    make_transparent(sys.argv[1], sys.argv[2])
