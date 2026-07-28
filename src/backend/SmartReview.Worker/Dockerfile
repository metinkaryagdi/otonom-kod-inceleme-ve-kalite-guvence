FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY src/backend/SmartReview.Core/SmartReview.Core.csproj src/backend/SmartReview.Core/
COPY src/backend/SmartReview.Application/SmartReview.Application.csproj src/backend/SmartReview.Application/
COPY src/backend/SmartReview.Infrastructure/SmartReview.Infrastructure.csproj src/backend/SmartReview.Infrastructure/
COPY src/backend/SmartReview.Worker/SmartReview.Worker.csproj src/backend/SmartReview.Worker/

RUN dotnet restore src/backend/SmartReview.Worker/SmartReview.Worker.csproj

COPY src/backend/ src/backend/
WORKDIR /app/src/backend/SmartReview.Worker
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "SmartReview.Worker.dll"]
