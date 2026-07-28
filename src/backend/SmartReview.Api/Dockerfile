FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY src/backend/SmartReview.Core/SmartReview.Core.csproj src/backend/SmartReview.Core/
COPY src/backend/SmartReview.Application/SmartReview.Application.csproj src/backend/SmartReview.Application/
COPY src/backend/SmartReview.Infrastructure/SmartReview.Infrastructure.csproj src/backend/SmartReview.Infrastructure/
COPY src/backend/SmartReview.Api/SmartReview.Api.csproj src/backend/SmartReview.Api/

RUN dotnet restore src/backend/SmartReview.Api/SmartReview.Api.csproj

COPY src/backend/ src/backend/
WORKDIR /app/src/backend/SmartReview.Api
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 80
ENTRYPOINT ["dotnet", "SmartReview.Api.dll"]
