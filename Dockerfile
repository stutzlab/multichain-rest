FROM openjdk:8-jdk-alpine

# create a Maven repo to store the downloaded jars
RUN mkdir -p /app
RUN mkdir -p /app/maven_repo

# just downlading the dependencies
RUN mkdir -p /tmp
WORKDIR /tmp
COPY pom.xml /tmp/pom.xml
RUN mvn -Dmaven.repo.local=/app/maven_repo dependency:go-offline
RUN mvn -Dmaven.repo.local=/app/maven_repo install; exit 0

# compiling and packaging the Java App
WORKDIR /app
COPY . /app
RUN mvn -Dmaven.repo.local=/app/maven_repo install

EXPOSE 8080

# fire in the hole
CMD ["/app/bin/java","-jar","/app/target/app.jar"]
