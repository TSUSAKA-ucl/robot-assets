const fs = require("fs");
const xml2js = require("xml2js");

async function loadUrdf(path) {
  const xml = fs.readFileSync(path, "utf8");
  return await xml2js.parseStringPromise(xml);
}

function buildGraph(robot) {
  const linkTags = {};
  const joints = {};
  const edges = {};
  const childToJoint = {};

  // linkタグ
  robot.robot.link?.forEach(link => {
    const name = link.$.name;
    linkTags[name] = link;
  });

  // jointタグ
  robot.robot.joint.forEach(j => {
    const name = j.$.name;
    const parent = j.parent[0].$.link;
    const child = j.child[0].$.link;

    joints[name] = j;

    edges[parent] = edges[parent] || [];
    edges[parent].push({ child, name });

    childToJoint[child] = name;
  });

  return { linkTags, joints, edges, childToJoint };
}

function findRoots(edges, childToJoint) {
  return Object.keys(edges).filter(p => !(p in childToJoint));
}

function extractChains(edges, childToJoint) {
  const roots = findRoots(edges, childToJoint);
  const chains = [];

  function dfs(link, chain) {
    if (!edges[link]) {
      chains.push([...chain]);
      return;
    }
    for (const { child, name } of edges[link]) {
      dfs(child, [...chain, name]);
    }
  }

  roots.forEach(r => dfs(r, []));
  return chains;
}

function collectLinks(joints, chain) {
  const set = new Set();
  chain.forEach(jname => {
    const j = joints[jname];
    set.add(j.parent[0].$.link);
    set.add(j.child[0].$.link);
  });
  return Array.from(set);
}

async function main() {
  const robot = await loadUrdf("input.urdf");
  const { linkTags, joints, edges, childToJoint } = buildGraph(robot);

  const chains = extractChains(edges, childToJoint);

  const builder = new xml2js.Builder();

  chains.forEach((chain, i) => {
    const links = collectLinks(joints, chain);

    const out = {
      robot: {
        $: { name: `chain_${i}` },
        link: links.map(l => linkTags[l]),
        joint: chain.map(j => joints[j])
      }
    };

    fs.writeFileSync(`chain_${i}.urdf`, builder.buildObject(out));

    fs.writeFileSync(
      `chain_${i}.json`,
      JSON.stringify(
        {
          links: links.map(l => ({ name: l })),
          joints: chain.map(j => ({
            name: j,
            type: joints[j].$.type,
            parent: joints[j].parent[0].$.link,
            child: joints[j].child[0].$.link
          }))
        },
        null,
        2
      )
    );

    console.log("Wrote chain", i);
  });
}

main();
