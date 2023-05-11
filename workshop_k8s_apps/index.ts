import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as crds_prom from "/home/ckdarby/test"

const prometheusServiceAccount = new kubernetes.core.v1.ServiceAccount("prometheusServiceAccount", {
    apiVersion: "v1",
    kind: "ServiceAccount",
    metadata: {
        name: "prometheus",
    },
});

const prometheusClusterRole = new kubernetes.rbac.v1.ClusterRole("prometheusClusterRole", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRole",
    metadata: {
        name: "prometheus",
    },
    rules: [
        {
            apiGroups: [""],
            resources: [
                "nodes",
                "nodes/metrics",
                "services",
                "endpoints",
                "pods",
            ],
            verbs: [
                "get",
                "list",
                "watch",
            ],
        },
        {
            apiGroups: [""],
            resources: ["configmaps"],
            verbs: ["get"],
        },
        {
            apiGroups: ["networking.k8s.io"],
            resources: ["ingresses"],
            verbs: [
                "get",
                "list",
                "watch",
            ],
        },
        {
            nonResourceURLs: ["/metrics"],
            verbs: ["get"],
        },
    ],
});

const prometheusClusterRoleBinding = new kubernetes.rbac.v1.ClusterRoleBinding("prometheusClusterRoleBinding", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRoleBinding",
    metadata: {
        name: "prometheus",
    },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "prometheus",
    },
    subjects: [{
        kind: "ServiceAccount",
        name: "prometheus",
        namespace: "default",
    }],
});



// Apply yaml files directly
const crdProm = new kubernetes.yaml.ConfigFile("my-crds-prom", { file: "/home/ckdarby/playground/crd2pulumi/bundle.yaml" });

//Prometheus CRD
new crds_prom.monitoring.v1.Prometheus("kappa123",
    {
        spec: {
            serviceAccountName: "prometheus",
            serviceMonitorSelector: {
                matchLabels: {team: "kappa"}
            },
            resources: {
                requests: {
                    memory: "400Mi"
                }
            }
        }
    }
);


const grafana = new kubernetes.helm.v3.Release(`grafana`, {
    name: `grafana`,
    chart: "grafana",
    repositoryOpts: {
        repo: "https://grafana.github.io/helm-charts",
    },
    values: {
        // dashboardProviders: {
        //     dashboardproviders: {
        //         apiversion:1,
        //         providers: 
        //             [{
        //                 name: 'grafana-dashboards',
        //                 orgId: 1,
        //                 folder: '',
        //                 type: 'file',
        //                 disableDeletion: false,
        //                 editable: true,
        //                 options: {path: "/var/lib/grafana/dashboards/grafana-dashboards"}
                        
        //             }]
        //     }
        // },
        sidecar: {
            dashboards: {enabled:  true}
        }
    },
});


const grafana_dashboardsConfigMap = new kubernetes.core.v1.ConfigMap("grafana_dashboardsConfigMap", {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
        name: "grafana-dashboards",
        labels: {
            grafana_dashboard: "1",
        },
    },
    data: {
        "grafana-dashboards.json": '{"annotations":{"list":[{"builtIn":1,"datasource":{"type":"grafana","uid":"-- Grafana --"},"enable":true,"hide":true,"iconColor":"rgba(0, 211, 255, 1)","name":"Annotations & Alerts","target":{"limit":100,"matchAny":false,"tags":[],"type":"dashboard"},"type":"dashboard"}]},"editable":true,"fiscalYearStartMonth":0,"graphTooltip":0,"id":2,"links":[],"liveNow":false,"panels":[{"datasource":{"type":"prometheus","uid":"voYeHXAVz"},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisCenteredZero":false,"axisColorMode":"text","axisLabel":"","axisPlacement":"auto","barAlignment":0,"drawStyle":"line","fillOpacity":0,"gradientMode":"none","hideFrom":{"legend":false,"tooltip":false,"viz":false},"lineInterpolation":"linear","lineWidth":1,"pointSize":5,"scaleDistribution":{"type":"linear"},"showPoints":"auto","spanNulls":false,"stacking":{"group":"A","mode":"none"},"thresholdsStyle":{"mode":"off"}},"mappings":[],"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"red","value":80}]}},"overrides":[]},"gridPos":{"h":8,"w":15,"x":0,"y":0},"id":1,"options":{"legend":{"calcs":[],"displayMode":"list","placement":"bottom","showLegend":true},"tooltip":{"mode":"single","sort":"none"}},"pluginVersion":"9.3.6","targets":[{"datasource":{"type":"prometheus","uid":"voYeHXAVz"},"editorMode":"builder","expr":"process_open_fds","instant":true,"key":"Q-c6b0298c-9788-4658-bf4f-edc09f6a2d9f-0","legendFormat":"__auto","range":true,"refId":"A"}],"title":"New Panel","type":"timeseries"}],"schemaVersion":37,"style":"dark","tags":[],"templating":{"list":[]},"time":{"from":"now-2d","to":"now"},"timepicker":{},"timezone":"","title":"Testola","uid":"Testola","version":1,"weekStart":""}',
    },
});




new crds_prom.monitoring.v1.ServiceMonitor(`test`,
    {
        metadata: {
           labels: {
            team: "kappa"
           }
        },
        spec: {
            endpoints: [{port: "service"}],
            selector: {
                matchLabels: {
                    "app.kubernetes.io/name": "grafana"
                }
            },

        }
        
    }
);

const apacheSuperSet = new kubernetes.helm.v3.Release(`superset`, {
    name: `superset`,
    chart: "superset",
    repositoryOpts: {
        repo: "https://apache.github.io/superset",
    },
});

//Determine grabbing password from helm Releases