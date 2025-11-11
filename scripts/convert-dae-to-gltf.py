import bpy
import sys
import os

def parse_args():
    """
    Blender の引数から
      --input <file.dae>
      --output <out_dir>
    を取得
    """
    argv = sys.argv
    if "--" not in argv:
        return None
    argv = argv[argv.index("--") + 1:]

    import argparse
    parser = argparse.ArgumentParser(description="Convert DAE to glTF")
    parser.add_argument("--input", required=True, help="Input DAE file")
    parser.add_argument("--output", required=True, help="Output directory")
    return parser.parse_args(argv)


def main():
    args = parse_args()
    if args is None:
        print("No arguments. Use --input <file.dae> --output <dir>")
        return

    dae_path = os.path.abspath(args.input)
    out_dir  = os.path.abspath(args.output)

    if not os.path.exists(dae_path):
        raise FileNotFoundError(f"Input file not found: {dae_path}")

    os.makedirs(out_dir, exist_ok=True)

    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import DAE
    print(f"Importing DAE: {dae_path}")
    bpy.ops.wm.collada_import(filepath=dae_path)

    # Output file path (.gltf)
    base = os.path.splitext(os.path.basename(dae_path))[0]
    gltf_path = os.path.join(out_dir, base + ".dae.gltf")

    print(f"Exporting glTF Separate: {gltf_path}")
    bpy.ops.export_scene.gltf(
        filepath=gltf_path,
        export_format='GLTF_SEPARATE',
        export_texture_dir="textures",
        export_materials='EXPORT',
    )

    print("✅ Finished.")


if __name__ == "__main__":
    main()
