async function main() {
  const response = await fetch('http://localhost:3000/api/v1/locations')
  const json: any = await response.json()
  console.log('API RESPONSE:', json)
}

main().catch(console.error)
