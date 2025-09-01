interface EngineData {
  id?: string
  engine_type: string
  engine_name: string
  engine_url: string
  engine_banner: string
  engine_logo: string
  engine_icon: string
  engine_description: string
  engine_version: string
  primary?: boolean
  credits: Array<{
    name: string
    role: string
    url: string
  }>
  credits_url: string
}

export default defineEventHandler(async (event) => {
  try {
    // Get the server assets storage
    const storage = useStorage('assets:server')
    
    // List of JSON files to load (since we can't list directory contents with storage)
    const jsonFiles = [
      'codename.json',
      'fps-plus.json', 
      'kade.json',
      'nightmarevision.json',
      'pslice.json',
      'psych.json',
      'psychonline.json',
      'vanilla.json'
    ]
    
    // Read and parse all JSON files
    const engines = await Promise.all(
      jsonFiles.map(async (file): Promise<EngineData | null> => {
        try {
          const engineData = await storage.getItem(`fridaylight/data/${file}`) as EngineData
          
          // Add the filename (without extension) as an id if not present
          if (engineData && !engineData.id) {
            engineData.id = file.replace('.json', '')
          }
          
          return engineData
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error)
          return null
        }
      })
    )
    
    // Filter out any null results from failed loads
    const validEngines = engines.filter((engine): engine is EngineData => engine !== null)
    
    // Sort engines: primary engines first, then alphabetically by name
    const sortedEngines = validEngines.sort((a, b) => {
      if (a.primary && !b.primary) return -1
      if (!a.primary && b.primary) return 1
      return a.engine_name.localeCompare(b.engine_name)
    })
    
    return {
      success: true,
      count: validEngines.length,
      engines: sortedEngines
    }
  } catch (error) {
    console.error('Error reading engine data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load engine data'
    })
  }
})