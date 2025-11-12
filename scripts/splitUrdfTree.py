import xml.etree.ElementTree as ET
import os
from collections import defaultdict

def load_urdf(path):
    tree = ET.parse(path)
    root = tree.getroot()
    return tree, root

def build_graph(root):
    joints = {}
    link_tags = {}

    # linkタグを収集
    for link in root.findall("link"):
        name = link.attrib["name"]
        link_tags[name] = link

    edges = defaultdict(list)
    child_to_joint = {}

    # jointタグを収集
    for joint in root.findall("joint"):
        name = joint.attrib["name"]
        parent = joint.find("parent").attrib["link"]
        child = joint.find("child").attrib["link"]

        joints[name] = joint
        edges[parent].append((child, name))
        child_to_joint[child] = name

    return joints, link_tags, edges, child_to_joint

def find_roots(edges, child_to_joint):
    roots = []
    for parent in edges.keys():
        if parent not in child_to_joint:
            roots.append(parent)
    return roots

def extract_chains(edges, child_to_joint):
    roots = find_roots(edges, child_to_joint)
    chains = []

    def dfs(current_link, chain):
        if current_link not in edges:
            chains.append(chain.copy())
            return
        for child, jname in edges[current_link]:
            dfs(child, chain + [jname])

    for root in roots:
        dfs(root, [])

    return chains

def collect_links_for_chain(joints, chain):
    link_names = set()
    for jname in chain:
        j = joints[jname]
        parent = j.find("parent").attrib["link"]
        child = j.find("child").attrib["link"]
        link_names.add(parent)
        link_names.add(child)
    return sorted(list(link_names))

def write_chain_xml(joints, link_tags, chain, index):
    root = ET.Element("robot")
    root.attrib["name"] = f"chain_{index}"

    # linkタグを追加
    links = collect_links_for_chain(joints, chain)
    for lname in links:
        if lname in link_tags:
            root.append(link_tags[lname])

    # jointタグを追加
    for jname in chain:
        root.append(joints[jname])

    tree = ET.ElementTree(root)
    output_path = f"chain_{index}.urdf"
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    print("Wrote:", output_path)

def write_chain_json(joints, link_tags, chain, index):
    import json
    links = collect_links_for_chain(joints, chain)

    data = {
        "links": [],
        "joints": []
    }

    for lname in links:
        link = link_tags[lname]
        data["links"].append({
            "name": lname,
            "xml": ET.tostring(link, encoding="unicode")
        })

    for jname in chain:
        j = joints[jname]
        data["joints"].append({
            "name": jname,
            "type": j.attrib.get("type"),
            "parent": j.find("parent").attrib["link"],
            "child": j.find("child").attrib["link"],
        })

    output_path = f"chain_{index}.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print("Wrote:", output_path)

def split_urdf_chains(path):
    tree, root = load_urdf(path)
    joints, link_tags, edges, child_to_joint = build_graph(root)
    chains = extract_chains(edges, child_to_joint)

    for i, chain in enumerate(chains):
        write_chain_xml(joints, link_tags, chain, i)
        write_chain_json(joints, link_tags, chain, i)

if __name__ == "__main__":
    split_urdf_chains("input.urdf")
