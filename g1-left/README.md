# 元データ情報
`https://github.com/unitreerobotics/unitree_ros.git`のデータをもとに
作成。`mode_machine`=5と仮定して `g1_29dof_with_hand_rev_1_0`使用

armのデータは多いので[`splitUrdfTree.py](../scripts/splitUrdfTree.py)あるいは
[`divideUrdfTreeWoOverlaps.py`](../scripts/divideUrdfTreeWoOverlaps.py)
で、直鎖部分を切り出して編集

gltfは、STLから[`convert-to-gltf.sh`](../scripts/convert-to-gltf.sh)で
変換。Unitree G1の場合系統的に作られているため、全てX軸回りに90度回転させれば
使用可能。

ハンド(指)部分は、データが少なく名前ですぐ分かるため、手作業で切り出し
2指と3指はpalmを描かないため`visual`は`[]`
