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
De API past bij het starten de aanwezige EF Core-migrations toe. Maak de
database vooraf of tijdens de eerste start aan met:

```powershell
cd api
dotnet restore
dotnet ef database update
dotnet run
```

De migration bevat zowel de portfolio-tabellen als de ASP.NET Core
Identity-tabellen. De tests gebruiken een aparte InMemory-database.

Open daarna `http://localhost:5000/swagger` (de exacte poort staat in de
terminal). Swagger UI toont alle CRUD-endpoints.

## Gebruikers, rollen en authenticatie

Publieke `GET`-requests blijven beschikbaar. `POST`, `PUT` en `DELETE` voor
projecten en blogposts vereisen een authenticatiecookie van een gebruiker met
de rol `Editor` of `Admin`, plus een CSRF-token. Een aangemelde gebruiker met
alleen de rol `Gast` krijgt `403 Forbidden`; een anonieme gebruiker krijgt
`401 Unauthorized`. De API controleert deze rollen zelf met de policy
`EditorOrAdmin`.

Configureer lokale Identity-gebruikers buiten Git met environment variables:

```powershell
$env:Identity__Admin__Username = "admin"
$env:Identity__Admin__Password = "<sterk lokaal wachtwoord>"
$env:Identity__Editor__Username = "editor"
$env:Identity__Editor__Password = "<sterk lokaal wachtwoord>"
dotnet run
```

In de `Development`-omgeving maakt de seeder deze gebruikers aan en kent hij
respectievelijk de rollen `Admin` en `Editor` toe. Iedere gebruiker die via
`POST /api/auth/register` wordt geregistreerd, krijgt uitsluitend de rol
`Gast`. Een publieke registratie kan dus nooit zelf `Editor` of `Admin`
worden. De drie rollen worden bij het opstarten aangemaakt als ze nog niet
bestaan. Na een rolwijziging moet de gebruiker opnieuw inloggen.

Zet nooit een plaintext-wachtwoord, wachtwoordhash of andere sleutel in
`appsettings.json` of in de repository. Voor de aparte lokale adminpagina
kan ook `Admin__Username` en `Admin__PasswordHash` worden gebruikt; die
authenticatie levert een `Admin`-rolclaim en blijft compatibel met dezelfde
schrijfpolicy. De beheerpagina staat op
`http://localhost:5106/admin.html` wanneer de developmentserver op de
standaardpoort draait.

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

De API gebruikt `ConnectionStrings__Portfolio` en de Identity- of
adminconfiguratie voor productiegeheimen.

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

| Routegroep | Toegang | Succes | Belangrijke afwijzingen |
| --- | --- | --- | --- |
| `GET /api/projects`, `GET /api/projects/{id}` | Iedereen | `200` | onbekend id: `404` |
| `GET /api/blogposts`, `GET /api/blogposts/{id}` | Iedereen | `200` | onbekend id: `404` |
| `POST`, `PUT`, `DELETE /api/projects...` | Editor of Admin + CSRF | `201` of `204` | anoniem: `401`, Gast: `403` |
| `POST`, `PUT`, `DELETE /api/blogposts...` | Editor of Admin + CSRF | `201` of `204` | anoniem: `401`, Gast: `403` |
| `POST /api/auth/register` | Iedereen | `201` en rol Gast | dubbele naam: `409`, ongeldige invoer: `400` |
| `POST /api/auth/login` | Iedereen | `200` en Identity-cookie | ongeldig wachtwoord: `401` |

De HTTP-dekking staat in het xUnit-project
`tests/MauriceSinon.Api.Tests.csproj`. `AdminApiTests` controleert de tien
CRUD-routecombinaties, publieke GETs, validatie, onbekende ids, `401`/`403`,
CSRF en schrijven als Editor en Admin. `AuthApiTests` controleert registratie,
de Guest-rol, login, cookies, logout en de afwijzing van elevated rollen bij
publieke registratie.

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
de service aan. EF Core vertaalt de LINQ-query naar SQL en de aanwezige EF
Core-migraties maken of wijzigen de database. In de tests wordt hiervoor
bewust een aparte InMemory-database gebruikt.

Een monolith past bij deze portfolio omdat de frontend en twee eenvoudige
datastromen één samenhangende applicatie vormen. Bij het scenario waarin een
bezoeker een nieuw project toevoegt, bindt Minimal API het verzoek aan een
input-DTO, voert de service de use case uit en slaat EF Core het project op in
SQL Server. Twee microservices zouden voor deze beperkte schaal extra deployment- en
communicatiecomplexiteit toevoegen. Deze keuze sluit aan bij de Microsoft Learn
bron [Create a Minimal API with ASP.NETCore](https://learn.microsoft.com/aspnet/core/tutorials/min-web-api).
