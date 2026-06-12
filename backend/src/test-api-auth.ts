async function main() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin1234' })
  })
  const loginData: any = await loginRes.json()
  const token = loginData.data.token

  // Fetch locations
  const res = await fetch('http://localhost:3000/api/v1/locations', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const json: any = await res.json()
  console.log('LOCATIONS API RETURNED COUNT:', json.data.length)
  console.log('LOCATIONS API ITEMS:', json.data.map((l: any) => ({ id: l.id, name: l.name, parentId: l.parentId })))
}

main().catch(console.error)
