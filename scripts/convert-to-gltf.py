import bpy
import sys
import os

def parse_args():
    """
    Blender の引数から
      --input <file.(dae|stl)>
      --output <out_dir>
    を取得
    """
    argv = sys.argv
    if "--" not in argv:
        return None
    argv = argv[argv.index("--") + 1:]

    import argparse
    parser = argparse.ArgumentParser(description="Convert DAE/STL to glTF")
    parser.add_argument("--input", required=True, help="Input file (.dae or .stl)")
    parser.add_argument("--output", required=True, help="Output directory")
    return parser.parse_args(argv)


def import_file(path):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".dae":
        print(f"Importing COLLADA: {path}")
        bpy.ops.wm.collada_import(filepath=path)

    elif ext == ".stl":
        print(f"Importing STL: {path}")
        bpy.ops.wm.stl_import(filepath=path)

    elif ext == ".ply":
        print(f"Importing PLY: {path}")
        bpy.ops.wm.ply_import(filepath=path)

    else:
        raise ValueError(f"Unsupported input format: {ext}")


def main():
    args = parse_args()
    if args is None:
        print("No arguments. Use --input <file> --output <dir>")
        return

    in_path = os.path.abspath(args.input)
    out_dir = os.path.abspath(args.output)

    if not os.path.exists(in_path):
        raise FileNotFoundError(f"Input file not found: {in_path}")

    os.makedirs(out_dir, exist_ok=True)

    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import
    import_file(in_path)

    # Export filename
    # base = os.path.splitext(os.path.basename(in_path))[0]
    base = os.path.basename(in_path)
    gltf_path = os.path.join(out_dir, base + ".gltf")

    print(f"Exporting glTF (Separate): {gltf_path}")

    bpy.ops.export_scene.gltf(
        filepath=gltf_path,
        export_format='GLTF_SEPARATE',   # .gltf + .bin + textures/
        export_texture_dir="textures",
        export_materials='EXPORT'
    )

    print("✅ Finished.")


if __name__ == "__main__":
    main()
