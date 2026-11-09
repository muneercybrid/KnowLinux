import { getDb } from './db.js'

const db = getDb()

async function main() {
  console.log('Seeding database...')

  // 1. Seed Top-Level & Sub-Categories
  const categoriesData = [
    // Top Level
    { name: 'Networking', slug: 'networking', letter: 'N', description: 'Network configuration, DNS, and diagnostics.', icon: 'Network', keywords: 'network, ping, dns' },
    { name: 'Security', slug: 'security', letter: 'S', description: 'Firewalls, encryption, and hardening.', icon: 'Shield', keywords: 'firewall, encrypt' },
    
    // Sub-categories for Networking
    { name: 'Network Scanners', slug: 'network-scanners', letter: 'N', description: 'Tools for discovering hosts and open ports.', icon: 'Network', parentSlug: 'networking' },
    { name: 'Packet Analyzers', slug: 'packet-analyzers', letter: 'P', description: 'Tools for capturing and inspecting network traffic.', icon: 'Network', parentSlug: 'networking' },

    // Sub-categories for Security
    { name: 'Web Scanners', slug: 'web-scanners', letter: 'W', description: 'Tools for assessing web application security.', icon: 'Shield', parentSlug: 'security' },
    { name: 'Forensics', slug: 'forensics', letter: 'F', description: 'Tools for digital evidence acquisition.', icon: 'Lock', parentSlug: 'security' },
  ]

  // First pass: Create all categories without parents
  for (const cat of categoriesData) {
    await db.orm.public.Category.upsert({
      conflictOn: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        letter: cat.letter,
        description: cat.description,
        icon: cat.icon,
        keywords: cat.keywords || '',
      },
    })
  }

  // Second pass: Link parents using chainable .where().update()
  for (const cat of categoriesData) {
    if (cat.parentSlug) {
      const parent = await db.orm.public.Category.where({ slug: cat.parentSlug }).first()
      if (parent) {
        await db.orm.public.Category.where({ slug: cat.slug }).update({
          parentId: parent.id,
        })
      }
    }
  }

  // 2. Seed Tools and link to Sub-Categories
  const toolsData = [
    { name: 'Nmap', slug: 'nmap-tool', description: 'Network exploration tool and security / port scanner.', categorySlug: 'network-scanners' },
    { name: 'Wireshark', slug: 'wireshark', description: 'Network protocol analyzer.', categorySlug: 'packet-analyzers' },
    { name: 'Nikto', slug: 'nikto', description: 'Web server scanner.', categorySlug: 'web-scanners' },
    { name: 'Autopsy', slug: 'autopsy', description: 'Digital forensics platform.', categorySlug: 'forensics' },
  ]

  for (const tool of toolsData) {
    const cat = await db.orm.public.Category.where({ slug: tool.categorySlug }).first()
    if (cat) {
      await db.orm.public.Tool.upsert({
        conflictOn: { slug: tool.slug },
        update: {},
        create: {
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          categoryId: cat.id,
        },
      })
    }
  }

  console.log('Seeding complete.')
}

main()
  .then(() => db.close())
  .catch(async (error) => {
    console.error(error)
    await db.close()
    process.exit(1)
  })
