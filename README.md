# Maurice Sinon portfolio

Deze repository bevat de portfoliofrontend en de backend voor opdracht 3:
een ASP.NET Core Minimal API met Entity Framework Core en SQL Server.

## Backend starten

Vereisten:

- .NET SDK 10
- SQL Server Express (de standaardconfiguratie gebruikt de instantie
  `.\SQLEXPRESS`)

De connection string staat in
[api/appsettings.json](./api/appsettings.json). Deze repository gebruikt de
lokaal geïnstalleerde SQL Server Express-instantie `.\SQLEXPRESS`. Pas
`ConnectionStrings:Portfolio` aan wanneer een andere SQL Server-instantie wordt gebruikt.
De API gebruikt
`Database.EnsureCreated()` bij het starten. Daardoor worden de tabellen
automatisch aangemaakt als de database nog niet bestaat; er is voor deze
opdracht geen migratie nodig.

```powershell
cd api
dotnet restore
dotnet run
```

Open daarna `http://localhost:5000/swagger` (de exacte poort staat in de
terminal). Swagger UI toont alle CRUD-endpoints.

## Architectuur

De backend gebruikt Minimal API met drie herkenbare verantwoordelijkheden:

```text
Swagger/client
    -> ProjectEndpoints of BlogPostEndpoints (routes en HTTP-resultaten)
    -> ProjectService of BlogPostService (use case en DTO-mapping)
    -> PortfolioDbContext (EF Core-datatoegang)
    -> SQL Server (persistente data)
```

De routes staan in `api/Endpoints`, de applicatielogica in
`api/Services`, de EF Core-context in `api/Data`, de entiteiten in `api/Models`
en de invoer- en uitvoer-DTO's in `api/Dtos`. Minimal API-routes ontvangen de
services via dependency injection en gebruiken de DbContext niet rechtstreeks.

Een `ProjectDto` en `BlogPostDto` zijn uitvoer-DTO's. De input-DTO's ontvangen
nooit een `Id`; de services maken de entiteiten aan en zetten ze expliciet om
naar DTO's. Daardoor blijven database-entiteiten intern.

## API-routes

Voor beide resources zijn de vijf CRUD-routes beschikbaar:

| Resource | Alle items | Eén item | Aanmaken | Wijzigen | Verwijderen |
| --- | --- | --- | --- | --- | --- |
| Projecten | `GET /api/projects` | `GET /api/projects/{id}` | `POST /api/projects` | `PUT /api/projects/{id}` | `DELETE /api/projects/{id}` |
| Blogposts | `GET /api/blogposts` | `GET /api/blogposts/{id}` | `POST /api/blogposts` | `PUT /api/blogposts/{id}` | `DELETE /api/blogposts/{id}` |

Een onbekend id geeft bij GET, PUT en DELETE HTTP 404. Een succesvolle POST
geeft HTTP 201 met een link naar het nieuwe item.

## Onderbouwing architectuur

Minimal API past bij deze kleine portfolio-API omdat de routes compact en
direct leesbaar zijn. `MapGet`, `MapPost`, `MapPut` en `MapDelete` bepalen het
HTTP-contract; de services bevatten de use cases voor projecten en blogposts.
Daardoor blijft een HTTP-detail, zoals `Results.NotFound()`, gescheiden van de
EF Core-query. Dezelfde opbouw is voor beide resources gebruikt, zodat een
nieuw endpoint voorspelbaar blijft.

Bij een nieuw veld in `Project` of `BlogPost` voeg ik het veld toe aan de
entiteit, configureer ik eventueel de lengte in `PortfolioDbContext`, en voeg
ik het toe aan de relevante input- en output-DTO. Daarna pas ik de mapping in
de service aan. EF Core vertaalt de LINQ-query naar SQL en
`EnsureCreated()` maakt de database opnieuw aan wanneer de database nog niet
bestaat. In een productieomgeving zou ik hiervoor migraties gebruiken.

Een monolith past bij deze portfolio omdat de frontend en twee eenvoudige
datastromen één samenhangende applicatie vormen. Bij het scenario waarin een
bezoeker een nieuw project toevoegt, bindt Minimal API het verzoek aan een
input-DTO, voert de service de use case uit en slaat EF Core het project op in
SQL Server. Twee
microservices zouden voor deze beperkte schaal extra deployment- en
communicatiecomplexiteit toevoegen. Deze keuze sluit aan bij de Microsoft Learn
bron [Create a Minimal API with ASP.NET
Core](https://learn.microsoft.com/aspnet/core/tutorials/min-web-api).

## Bewijs en procesverantwoording

Voor de inlevering moeten nog persoonlijke gegevens, Swagger-screenshots en
feedbackgegevens worden toegevoegd. Maak screenshots in deze volgorde voor
één project en één blogpost: POST, GET alle, GET op id, PUT, GET na een
herstart en DELETE gevolgd door GET op hetzelfde id (404). Noteer in de
procesverantwoording de gebruikte bronnen, eventuele AI-hulp en eigen
controle, ontvangen feedback, de verwerking daarvan en de zelfstudie-uren per
leeruitkomst. De rubric schrijft ook minimaal zes commits over minimaal drie
weken voor; dat is repositoryhistorie en kan niet door de code zelf worden
afgedwongen.
