import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as pg from "@pulumi/azure-native/dbforpostgresql";

// Configuracion base
const config = new pulumi.Config();
const location = config.require("location");
const resourceGroupName = "rg-aks-demo";
const clientConfig = pulumi.output(azure.authorization.getClientConfig());

// Resource Group
const rg = new azure.resources.ResourceGroup("rg", {
    resourceGroupName,
    location,
});

// VNet
const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName,
    location,
    addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
});

// Subnet AKS
const subnetAks = new azure.network.Subnet("subnet-aks", {
    resourceGroupName,
    virtualNetworkName: vnet.name,
    addressPrefix: "10.0.1.0/24",
    delegations: [{
        name: "aks-delegation",
        serviceName: "Microsoft.ContainerService/managedClusters",
    }],
});

// ACR
const acrName = "acrdemo" + pulumi.getStack();   // 5+ chars, único por stack
const acr = new azure.containerregistry.Registry("acr", {
    resourceGroupName,
    location,
    registryName: acrName,
    sku: { name: "Basic" },
    adminUserEnabled: false, // seguro
});

// PostgreSQL Single Server
const db = new pg.Server("pg", {
    resourceGroupName,
    location,
    serverName: "pgdemo",
    version: "11",
    administratorLogin: "adminpg",
    administratorLoginPassword: config.requireSecret("dbPassword"),
    sku: {
        name: "B_Gen5_1",
        tier: "Basic",
    },
});

// AKS Cluster
const aks = new azure.containerservice.ManagedCluster("aks", {
    resourceGroupName,
    location,
    dnsPrefix: "aksdemo",
    identity: { type: "SystemAssigned" },
    agentPoolProfiles: [{
        name: "nodepool",
        count: 2,
        vmSize: "Standard_B4ms",
        vnetSubnetID: subnetAks.id,
        mode: "System",
    }],
    networkProfile: {
        networkPlugin: "azure",
        loadBalancerSku: "standard",
    },
});

// Identidad del kubelet (no tipada en ManagedCluster)
const kubeletObjectId = pulumi.output(aks).apply((cluster: any) =>
    cluster.identityProfile?.kubeletidentity?.objectId ?? cluster.identity?.principalId ?? "",
);

// Permitir que AKS lea imagenes del ACR
const roleAssignment = new azure.authorization.RoleAssignment("aks-acr-role", {
    principalId: kubeletObjectId,
    principalType: "ServicePrincipal",
    scope: acr.id,
    roleDefinitionId: pulumi.interpolate`/subscriptions/${clientConfig.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
});

// Outputs
export const acrLogin = acr.loginServer;
export const aksName = aks.name;
export const dbHost = db.fullyQualifiedDomainName;
