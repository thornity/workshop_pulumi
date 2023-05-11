import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

const stackName = pulumi.getStack().replace(/_/g, "-");

const config = new pulumi.Config();
const k8sNamespace = pulumi.getProject().replace(/_/g, "-");
const appLabels = {
    app: `${stackName}-redis`,
};

// Create a namespace
const redisNs = new kubernetes.core.v1.Namespace(`${k8sNamespace}-ns`, {metadata: {
    labels: appLabels
}});

// Use Helm to install redis
const redis = new kubernetes.helm.v3.Release(`${stackName}-redis`, {
    name: `${stackName}-redis`,
    chart: "redis",
    namespace: redisNs.metadata.name,
    repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
    },
});

// Export some values for use elsewhere
export const name = redis.name;
