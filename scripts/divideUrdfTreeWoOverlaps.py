import xml.etree.ElementTree as ET
from collections import defaultdict

def load_urdf(path):
    tree = ET.parse(path)
    root = tree.getroot()
    return tree, root

def build_graph(root):
    joints = {}
    link_tags = {}
    child_map = defaultdict(list)
    parent_map = {}

    # linkタグの収集
    for link in root.findall("link"):
        name = link.attrib["name"]
        link_tags[name] = link

    # jointタグの収集
    for joint in root.findall("joint"):
        name = joint.attrib["name"]
        parent = joint.find("parent").attrib["link"]
        child = joint.find("child").attrib["link"]

        joints[name] = joint
        child_map[parent].append((child, name))
        parent_map[child] = name

    return joints, link_tags, child_map, parent_map

def find_roots(child_map, parent_map):
    roots = []
    for link in child_map.keys():
        if link not in parent_map:
            roots.append(link)
    return roots

def collect_chain(child_map, parent_map, start_link):
    """
    start_link を起点に「分岐のない最大直鎖」を作る
    """
    chain = []
    current = start_link

    # 次の joint が 1 個だけ続く限り直鎖
    while current in child_map and len(child_map[current]) == 1:
        child, jname = child_map[current][0]
        chain.append(jname)
        current = child

    return chain

def split_urdf(path):
    _, root = load_urdf(path)
    joints, link_tags, child_map, parent_map = build_graph(root)

    # すでにチェーンに入れた joint
    used_joints = set()

    chains = []

    # root link から「メイン直鎖」を取る
    roots = find_roots(child_map, parent_map)

    for root_link in roots:
        chain = collect_chain(child_map, parent_map, root_link)
        for j in chain:
            used_joints.add(j)
        chains.append(chain)

        # 直鎖の末端から分岐を探索
        end_link = None
        if chain:
            end_link = joints[chain[-1]].find("child").attrib["link"]
        else:
            end_link = root_link

        frontier = [end_link]

        while frontier:
            link = frontier.pop()

            # 分岐点（child が複数）を全て処理
            if link in child_map and len(child_map[link]) > 1:
                for child, jname in child_map[link]:
                    # この jname がまだ使われていなければ新チェーン
                    if jname not in used_joints:
                        new_chain = collect_chain(child_map, parent_map, link)
                        for j in new_chain:
                            used_joints.add(j)
                        chains.append(new_chain)

                        # 末端リンクを frontier に追加
                        if new_chain:
                            last_link = joints[new_chain[-1]].find("child").attrib["link"]
                            frontier.append(last_link)

    # 出力
    for i, chain in enumerate(chains):
        write_chain_files(i, chain, joints, link_tags)

def write_chain_files(index, chain, joints, link_tags):
    # --- link の収集 ---
    link_set = set()
    for jname in chain:
        j = joints[jname]
        link_set.add(j.find("parent").attrib["link"])
        link_set.add(j.find("child").attrib["link"])

    # ---- XML 出力 ----
    root = ET.Element("robot", name=f"chain_{index}")
    for lname in sorted(link_set):
        root.append(link_tags[lname])
    for jname in chain:
        root.append(joints[jname])

    tree = ET.ElementTree(root)
    tree.write(f"chain_{index}.urdf", encoding="utf-8", xml_declaration=True)

    # ---- JSON 出力 ----
    import json
    with open(f"chain_{index}.json", "w") as f:
        json.dump({
            "links": sorted(list(link_set)),
            "joints": chain
        }, f, indent=2)

    print("Wrote chain", index)
