# Maurice Sinon portfolio

Deze repository bevat de portfoliofrontend en de backend voor opdracht 3:
een ASP.NET Core Minimal API met Entity Framework Core en SQL Server.

## Backend starten

Vereisten:

- .NET SDK 10
- SQL Server Express (de standaardconfiguratie gebruikt de instantie
  `.\SQLEXPRESS`)

De lokale connection string staat in
[api/appsettings.Development.json](./api/appsettings.Development.json). Deze
repository gebruikt de lokaal geïnstalleerde SQL Server Express-instantie
`.\SQLEXPRESS`. Voor andere omgevingen moet
`ConnectionStrings__Portfolio` via environment variables of secret storage
worden ingesteld; productieconfiguratie staat niet in Git.
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

## CORS en production configuratie

CORS staat niet meer open voor alle origins. Development staat alleen de
gebruikelijke lokale frontendpoorten toe. De basisconfiguratie staat de
GitHub Pages-origin `https://mausin123457.github.io` toe. Voeg een nieuwe
frontend-origin alleen toe via `Cors:AllowedOrigins` in de configuratie van de
betreffende omgeving. Ook al gebruikt Github Pages geen back end, is dit toch
toegevoegd om te laten zien hoe dit in een echte productie omgeving zou werken.

De API gebruikt `ConnectionStrings__Portfolio` en
`Admin__PasswordHash` voor productiegeheimen.

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

De backend is een gelaagde monolith met twee herkenbare verticale slices:
één voor projecten en één voor blogposts. Beide slices lopen van de frontend of
Swagger via respectievelijk `ProjectEndpoints` of `BlogPostEndpoints` naar de
bijbehorende service, input- en output-DTO's, entiteit en uiteindelijk de
`PortfolioDbContext` en SQL Server. De endpoints zijn verantwoordelijk voor
routes, model binding, autorisatie en HTTP-resultaten, terwijl de services de
use cases, databasequery's en DTO-mapping uitvoeren. De database-entiteiten
staan in `api/Models`, de context in `api/Data`, de services in `api/Services`
en de DTO's in `api/Dtos`. De routes ontvangen hun services via dependency
injection en gebruiken de DbContext niet rechtstreeks. Authenticatie, CSRF,
CORS, configuratie en de DbContext zijn gedeelde infrastructuur voor beide
slices; de project- en blogpostlogica zelf blijft per resource gescheiden.

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
SQL Server. Twee microservices zouden voor deze beperkte schaal extra deployment- en
communicatiecomplexiteit toevoegen. Deze keuze sluit aan bij de Microsoft Learn
bron [Create a Minimal API with ASP.NETCore](https://learn.microsoft.com/aspnet/core/tutorials/min-web-api).
