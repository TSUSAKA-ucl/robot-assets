# Kinova gen3 7DOF assets

```
cd src
git clone https://github.com/Kinovarobotics/ros2_kortex.git
cd -
```
```
colcon build
```
```
cd install/kortex_description/share/kortex_description/robots/
xacro kinova.urdf.xacro name:=kinova arm:=gen3 dof:=7
cd -
```
```
cd ./install/kortex_description/share/kortex_description/arms/gen3/7dof/meshes/
for dae in base_link.dae\
	   shoulder_link.dae\
	   half_arm_1_link.dae\
	   half_arm_2_link.dae\
	   forearm_link.dae\
	   spherical_wrist_1_link.dae\
	   spherical_wrist_2_link.dae\
	   bracelet_no_vision_link.dae
do assimp export "$dae" "$dae".gltf
done
```
