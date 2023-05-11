import * as pulumi from "@pulumi/pulumi";
import * as civo from "@pulumi/civo";

const projectName = pulumi.getProject();
const stackName = pulumi.getStack();

const firewall = new civo.Firewall(`civo-firewall-${projectName}-${stackName}`, {
  region: "NYC1",
  createDefaultRules: true,
});

const cluster = new civo.KubernetesCluster(`civo-kubernetes-${projectName}-${stackName}`, {
  pools: {
    nodeCount: 1,
    size: "g4s.kube.xsmall"
  },
  region: "NYC1",
  firewallId: firewall.id,
})

export const clusterName = cluster.name
export const kubeConfig = cluster.kubeconfig
