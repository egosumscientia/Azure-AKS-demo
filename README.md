Arquitectura AKS en Azure con Pulumi, contenedores y Kubernetes

Este proyecto implementa una arquitectura completa en Azure utilizando Kubernetes (AKS), Azure Container Registry (ACR), PostgreSQL Flexible Server, una red virtual con subnets aisladas y un Load Balancer estándar. La infraestructura es gestionada con Pulumi en TypeScript, lo que permite un enfoque programático para la definición de recursos, facilita la modularidad, la reutilización de código y habilita automatización avanzada.

La aplicación de ejemplo se despliega como contenedor, construida mediante Docker y publicada en ACR. El flujo operativo consiste en:

Crear la infraestructura con Pulumi.

Construir y etiquetar la imagen de la aplicación.

Enviar la imagen al ACR.

Desplegar los manifiestos Kubernetes para exponer la aplicación mediante un Service tipo LoadBalancer y un Ingress opcional.

Estructura del proyecto

El repositorio se organiza en carpetas que separan claramente los componentes:

infra/
Contiene Pulumi.yaml, la configuración del stack y el archivo principal con los recursos de Azure:

VNet con subnets independientes para AKS y la base de datos

Azure Container Registry

PostgreSQL Flexible Server

Asignación de permisos entre AKS y ACR

Cluster AKS con red avanzada

app/
Incluye el código de la aplicación, basada en Node.js, y el Dockerfile utilizado para generar la imagen de contenedor.

k8s/
Contiene los manifiestos Kubernetes (Deployment, Service e Ingress) que consumen imágenes alojadas en ACR.

pipelines/
Puede contener un pipeline de GitHub Actions o Azure Pipelines encargado de autenticarse contra ACR, construir la imagen, etiquetarla, enviarla al registro y desplegarla en AKS.

Alcance técnico

Este proyecto demuestra competencias avanzadas en:

Arquitectura cloud moderna en Azure

Contenedores y Docker

Kubernetes (AKS)

Redes virtuales y seguridad

Integración de servicios administrados (PostgreSQL Flexible Server)

Automatización e infraestructura como código con Pulumi

Pipelines de entrega continua

Objetivo

El repositorio sirve como demostración senior de un entorno productivo reducido pero realista, integrando los componentes esenciales de una plataforma empresarial basada en Azure y AKS. Es una base extensible para añadir microservicios, entornos adicionales, integración con servicios cloud, observabilidad o políticas de seguridad avanzadas.