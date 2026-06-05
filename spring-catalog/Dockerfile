# =========================
# BUILD STAGE
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# copia apenas pom primeiro (melhor cache)
COPY pom.xml .

# baixa dependências
RUN mvn dependency:go-offline

# copia código fonte
COPY src ./src

# build da aplicação
RUN mvn clean package -DskipTests

# =========================
# RUNTIME STAGE
# =========================
FROM eclipse-temurin:21-jdk

WORKDIR /app

# copia o jar gerado
COPY --from=build /app/target/*.jar app.jar

# expõe porta do Spring Boot
EXPOSE 8080

# comando de execução
ENTRYPOINT ["java", "-jar", "app.jar"]