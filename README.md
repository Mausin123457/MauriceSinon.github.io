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

## Adminbeheer en authenticatie

Publieke `GET`-requests blijven beschikbaar. `POST`, `PUT` en `DELETE` voor
projecten en blogposts vereisen een admin-cookie en een CSRF-token. De
beheerpagina staat op `http://localhost:5106/admin.html` wanneer de
developmentserver op de standaardpoort draait.

Configureer het adminaccount buiten Git met environment variables:

```powershell
$env:Admin__Username = "admin"
$env:Admin__PasswordHash = "<ASP.NET PasswordHasher hash>"
dotnet run
```

De hash moet met `Microsoft.AspNetCore.Identity.PasswordHasher` worden gemaakt;
zet nooit een plaintext-wachtwoord of een echte hash in
`appsettings.json`. De standaardconfiguratie bevat bewust geen bruikbare
hash, waardoor login pas werkt nadat deze variabele is ingesteld.

De beheerpagina gebruikt dezelfde API-origin en HttpOnly/SameSite cookie-auth,
plus een apart CSRF-token voor wijzigende requests. In development gebruikt de
app gewone cookie-namen omdat de standaardserver via HTTP draait; op HTTPS
kunnen deze cookies met een `__Host-`-prefix en `Secure` worden aangescherpt.
De tests gebruiken een
geïsoleerde InMemory-database en testen login, autorisatie, CSRF en
requestvalidatie:

```powershell
dotnet test .\tests\MauriceSinon.Api.Tests.csproj
```

## Frontend en API

De publieke project- en blogpagina's laden lokaal hun gegevens met `fetch()`
uit de API. Lokaal gebruikt de frontend automatisch
`http://localhost:5106`. Op GitHub Pages gebruikt de frontend voorlopig een
statische lijst met objecten in `scripts/main.js`, omdat GitHub Pages alleen
statische bestanden host en geen ASP.NET-backend uitvoert.

Je kunt de frontend daarvoor configureren vóór `scripts/main.js` wordt geladen:

```html
<script>
  window.PORTFOLIO_API_URL = "https://api.example.com";
</script>
<script type="module" src="./scripts/main.js"></script>
```

Gebruik op pagina's in `pages/` het juiste relatieve pad naar `main.js`.
Zolang `PORTFOLIO_API_URL` leeg is op een niet-lokale host, gebruikt de
frontend deze statische fallbackdata. Zodra er later een publieke API is, kan
`PORTFOLIO_API_URL` worden ingesteld om de API te gebruiken.

Swagger is alleen beschikbaar als de ASP.NET-host in de `Development`
environment draait. Een GitHub Pages-deployment verandert de environment van
de API niet, omdat GitHub Pages de API niet uitvoert; de apart gehoste API moet
zelf met de gewenste environment worden geconfigureerd.

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
