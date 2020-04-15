# Personbruker OIDC-provider GUI

Mini GUI som brukes for å kommunisere med en OIDC-provider på localhost for å hente ut et token som kan brukes i testing.
Denne appen startes typisk vha docker-compose for å kjøres sammen med en OIDC-provider og backend-apper.


# Kom i gang

## Kjøre lokalt for utvikling
1. Bygg appen: `npm install`
2. Start appen: `npm start`
3. GUI-et kan nås på `http://localhost:5000`

### Ta i bruk pb-oidc-provider-gui sammen med pb-oidc-provider
1. Start både `pb-oidc-provider` og `pb-oidc-provider-gui` samtidig: `docker-compose up`
2. GUI-et nås på `http://localhost:5000`

### Bygge nytt docker-image
1. Kjør kommandoen: `docker build . -t navikt/pb-oidc-provider-gui:<nytt versjonsnummer>`
2. Start appen med kommandoen: `docker rund -t navikt/pb-oidc-provider-gui:<versjonsnummeret fra steg 1>`

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan rettes mot https://github.com/orgs/navikt/teams/personbruker

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #team-personbruker.
