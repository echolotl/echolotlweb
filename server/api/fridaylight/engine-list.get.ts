import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    // Path to the JSON files directory
    const dataDir = join(process.cwd(), 'assets', 'fridaylight', 'data')
    
    // Read all files in the directory
    const files = await readdir(dataDir)
    
    // Filter only JSON files
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    // Read and parse all JSON files
    const engines = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(dataDir, file)
        const fileContent = await readFile(filePath, 'utf-8')
        const engineData = JSON.parse(fileContent)
        
        // Add the filename (without extension) as an id if not present
        if (!engineData.id) {
          engineData.id = file.replace('.json', '')
        }
        
        return engineData
      })
    )
    
    // Sort engines: primary engines first, then alphabetically by name
    const sortedEngines = engines.sort((a, b) => {
      if (a.primary && !b.primary) return -1
      if (!a.primary && b.primary) return 1
      return a.engine_name.localeCompare(b.engine_name)
    })
    
    return {
      success: true,
      count: engines.length,
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