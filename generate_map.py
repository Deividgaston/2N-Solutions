
import random
import math

def generate_dotted_map(filename="assets/world-map.svg"):
    width = 1000
    height = 500
    
    # Simple approximate continent bounding boxes (min_lon, max_lon, min_lat, max_lat)
    # Scaled to 0-width, 0-height. 
    # Lon: -180 to 180 -> 0 to width
    # Lat: +90 to -90 -> 0 to height
    
    # Coarse approximation of landmasses for dot generation
    land_boxes = [
        # North America
        (-170, -50, 20, 75),
        # South America
        (-85, -35, -55, 12),
        # Europe
        (-10, 40, 35, 70),
        # Africa
        (-20, 50, -35, 37),
        # Asia
        (40, 150, 5, 75),
        # Australia
        (110, 155, -40, -10)
    ]

    svg_content = f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">'
    
    # Add a subtle grid
    # for x in range(0, width, 50):
    #     svg_content += f'<line x1="{x}" y1="0" x2="{x}" y2="{height}" stroke="#111" stroke-width="1" />'
    # for y in range(0, height, 50):
    #     svg_content += f'<line x1="0" y1="{y}" x2="{width}" y2="{y}" stroke="#111" stroke-width="1" />'

    dots = []
    
    step = 8 # Distance between dots
    
    for x in range(0, width, step):
        for y in range(0, height, step):
            # Convert screen x,y to lon,lat
            lon = (x / width) * 360 - 180
            lat = 90 - (y / height) * 180
            
            is_land = False
            for box in land_boxes:
                if box[0] <= lon <= box[1] and box[2] <= lat <= box[3]:
                    # Refine shapes a bit with random noise or circle exclusion
                    # Simplified logic: just box check
                    
                    # Cutout rough shapes
                    # Atlantic ocean cutout roughly
                    if -50 < lon < -10 and 0 < lat < 60: continue
                    # Indian ocean
                    if 50 < lon < 100 and lat < 5: continue
                    
                    is_land = True
                    break
            
            if is_land:
                # Randomize opacity slightly for tech effect
                opacity = random.uniform(0.3, 0.7)
                
                # Add "glitch" dots with higher brightness
                color = "#444" 
                if random.random() > 0.98:
                    color = "#0099ff" # 2N Blue
                    opacity = 0.8
                
                radius = 1.5
                dots.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{color}" opacity="{opacity}" />')

    svg_content += "".join(dots)
    svg_content += '</svg>'
    
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_dotted_map()
