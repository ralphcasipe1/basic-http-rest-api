import http from 'node:http'
import url from 'node:url'

type Laureate = {
  id: string
  firstname: string
  surname: string
  motivation: string
  share: string
}

type Prize = {
  year: string
  category: string
  laureates?: Laureate[] | null
}

const PORT = 3000;
const PRIZE_API_ENDPOINT = 'https://api.nobelprize.org/v1/prize.json'
const headers = {
  'Content-Type': 'application/json'
}

const server = http.createServer((req, res) => {
  const { method } = req
  const parsedUrl = url.parse(req.url!, true);
  const { pathname, query } = parsedUrl;
  let body: Buffer[] = [];

  req.on('error', (err: Error) => console.error(err))
    .on('data', (chunk: Buffer) => body.push(chunk))
    .on('end', async () => {
      if (pathname === '/' && method === 'GET') {
        const response = await fetch(PRIZE_API_ENDPOINT)
        const data: { prizes: Prize[] } = await response.json()
        let { prizes } = data
        
        let responseBody: any[] = prizes

        if (query.year) {
          responseBody = responseBody.filter(body => body.year === query.year)
        }
        
        if (query.category) {
          responseBody = responseBody.filter(body => {
            const categories = parseCommasToArray(query.category as string)
            
            return categories.includes(body.category)
          })
        }

        const laureates: Laureate[] = []
        for (const obj of responseBody) {
          if (obj['laureates']) {
            (obj['laureates']).forEach((laureate: any) => {
              laureates.push(laureate)
            })
          }
        }
        responseBody = laureates

        if (query.firstname) {
          responseBody = laureates?.filter(laureate => laureate.firstname?.match(new RegExp(query.firstname as string, 'g')))
        }
        
        if (query.lastname) {
          responseBody = laureates?.filter(laureate => laureate.surname?.match(new RegExp(query.lastname as string, 'g')))
        }
        
        
        res.writeHead(200, headers);
        res.end(JSON.stringify(responseBody));
      } else {
        res.writeHead(404);
        res.end();
      }
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function parseCommasToArray(str: string): string[] {
  return str.split(',').map(element => element.trim())
}