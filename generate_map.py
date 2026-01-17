
import random
import math

def generate_dotted_map(filename="assets/world-map.svg"):
    width = 1000
    height = 500
    
    # Simple approximate continent bounding boxes (min_lon, max_lon, min_lat, max_lat)
    # Scaled to 0-width, 0-height. 
    # Lon: -180 to 180 -> 0 to width
    # Lat: +90 to -90 -> 0 to height
    
    # Simplified continent polygons (approximated coordinates for recognized shape)
    # Normzlized to 0-100 x, 0-100 y conceptually, then scaled
    continents = [
        # North America
        [(15, 10), (35, 10), (45, 20), (40, 40), (25, 45), (10, 30)],
        # South America
        [(30, 50), (45, 50), (50, 65), (40, 85), (30, 70)],
        # Europe
        [(45, 15), (60, 15), (55, 30), (45, 30)],
        # Africa
        [(45, 35), (65, 35), (70, 60), (55, 75), (40, 50)],
        # Asia
        [(60, 10), (90, 10), (95, 40), (80, 55), (65, 40)],
        # Australia
        [(80, 65), (95, 65), (95, 80), (80, 80)]
    ]
    
    # Better polygon data (normalized 0-360 lon refined to 0-width, 0-180 lat refined to 0-height)
    # Using a Ray-Casting algorithm for Point in Polygon
    
    def is_inside(x, y, polygon):
        n = len(polygon)
        inside = False
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    # Let's use a very rough but recognizable shape based on X/Y percentage
    # Width 1000, Height 500. 
    # Data points (x%, y%) roughly mapping world landmass
    
    polygons = [
        # N. America
        [(5, 10), (30, 5), (45, 5), (40, 20), (30, 40), (28, 48), (20, 30), (5, 20)],
        # S. America
        [(28, 48), (35, 48), (40, 60), (35, 85), (25, 60)],
        # Europe
        [(45, 10), (55, 10), (60, 25), (45, 30), (40, 25)],
        # Africa
        [(42, 32), (60, 32), (65, 50), (55, 75), (45, 60), (40, 40)],
        # Asia
        [(60, 10), (95, 5), (98, 30), (85, 50), (75, 40), (65, 35)],
        # Australia
        [(80, 65), (95, 65), (95, 85), (80, 80)]
    ]

    svg_content = f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">'
    dots = []
    step = 8
    
    for x in range(0, width, step):
        for y in range(0, height, step):
            px = (x / width) * 100
            py = (y / height) * 100
            
            is_land = False
            for poly in polygons:
                if is_inside(px, py, poly):
                    is_land = True
                    break
            
            if is_land:
                opacity = random.uniform(0.3, 0.7)
                color = "#444" 
                if random.random() > 0.98:
                    color = "#0099ff"
                    opacity = 0.8
                
                radius = 1.3
                dots.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{color}" opacity="{opacity}" />')

    svg_content += "".join(dots)
    svg_content += '</svg>'
    
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_dotted_map()
