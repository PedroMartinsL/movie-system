# =========================
# BUILD STAGE
# =========================
FROM maven:3.9.16-eclipse-temurin-25 AS builder

WORKDIR /app

# copia pom primeiro (cache de dependências)
COPY pom.xml .

# baixa dependências
RUN mvn dependency:go-offline -B

# copia código
COPY src ./src

# build da aplicação
RUN mvn clean package -DskipTests -B

# =========================
# RUNTIME STAGE
# =========================
FROM eclipse-temurin:25-jdk

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]