import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as db from "@pulumi/azure-native/dbforpostgresql";
import * as resources from "@pulumi/azure-native/resources";

const config = new pulumi.Config();
const location = config.require("location");
const clientConfig = pulumi.output(azure.authorization.getClientConfig());

// Resource Group
const rg = new resources.ResourceGroup("rg-aks-demo", {
    resourceGroupName: "rg-aks-demo",
    location,
});

// VNet
const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName: rg.name,
    location,
    addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
});

// Subnet AKS
const subnetAks = new azure.network.Subnet("subnet-aks", {
    resourceGroupName: rg.name,
    virtualNetworkName: vnet.name,
    addressPrefix: "10.0.1.0/24",
    delegations: [{
        name: "aks-delegation",
        serviceName: "Microsoft.ContainerService/managedClusters",
    }],
    privateEndpointNetworkPolicies: "Disabled",
    privateLinkServiceNetworkPolicies: "Disabled",
}, { dependsOn: [vnet] });

// ACR
const acrName = "acrdemo" + pulumi.getStack();
const acr = new azure.containerregistry.Registry("acr", {
    resourceGroupName: rg.name,
    location,
    registryName: acrName,
    sku: { name: "Basic" },
    adminUserEnabled: false,
});

// PostgreSQL Flexible Server
// PostgreSQL Flexible Server
const pg = new db.Server("pgserver", {
    resourceGroupName: rg.name,
    location,
    serverName: "pgserver",
    version: "13",

    sku: {
        name: "Standard_D2ds_v4",
        tier: "GeneralPurpose",
    },

    administratorLogin: "pgadmin",
    administratorLoginPassword: "SuperPassword123!",

    storage: {
        storageSizeGB: 32,
    }

});

// AKS Cluster
const aks = new azure.containerservice.ManagedCluster("aks", {
    resourceGroupName: rg.name,
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

// Kubelet identity
const kubeletObjectId = pulumi
    .all([aks.identityProfile, aks.identity])
    .apply(([profile, identity]) =>
        profile?.["kubeletidentity"]?.objectId ?? identity?.principalId ?? ""
    );

// Role Assignment AKS → ACR
const roleAssignment = new azure.authorization.RoleAssignment("aks-acr-role", {
    principalId: kubeletObjectId,
    principalType: "ServicePrincipal",
    scope: acr.id,
    roleDefinitionId: pulumi.interpolate`/subscriptions/${clientConfig.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
});

// Obtener FQDN del servidor PostgreSQL
const pgInfo = db.getServerOutput({
    resourceGroupName: rg.name,
    serverName: pg.name,
});

// Outputs
export const acrLogin = acr.loginServer;
export const aksName = aks.name;
export const dbHost = pgInfo.fullyQualifiedDomainName;
