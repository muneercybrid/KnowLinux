import { getDb } from './db.js'

const db = getDb()

async function main() {
  console.log('Seeding database...')

  const categoriesData = [
    { name: 'Networking', slug: 'networking', letter: 'N', description: 'Network configuration, DNS, and diagnostics.', icon: 'Network', keywords: 'network' },
    { name: 'Security', slug: 'security', letter: 'S', description: 'Firewalls, encryption, and hardening.', icon: 'Shield', keywords: 'security' },
    { name: 'System Administration', slug: 'sysadmin', letter: 'S', description: 'System management, monitoring, and utilities.', icon: 'Server', keywords: 'sysadmin' },
    { name: 'Development', slug: 'development', letter: 'D', description: 'Compilers, code editors, and version control.', icon: 'Code', keywords: 'dev, code' },
    { name: 'Network Scanners', slug: 'network-scanners', letter: 'N', description: 'Tools for discovering hosts and open ports.', icon: 'Network', parentSlug: 'networking' },
    { name: 'Packet Analyzers', slug: 'packet-analyzers', letter: 'P', description: 'Tools for capturing network traffic.', icon: 'Network', parentSlug: 'networking' },
    { name: 'Web Scanners', slug: 'web-scanners', letter: 'W', description: 'Web application security scanners.', icon: 'Shield', parentSlug: 'security' },
    { name: 'Forensics', slug: 'forensics', letter: 'F', description: 'Digital evidence acquisition.', icon: 'Lock', parentSlug: 'security' },
    { name: 'Monitoring', slug: 'monitoring', letter: 'M', description: 'System resource and performance monitoring.', icon: 'Server', parentSlug: 'sysadmin' },
    { name: 'Text Editors', slug: 'text-editors', letter: 'T', description: 'Command-line and GUI text editors.', icon: 'Code', parentSlug: 'development' },
    { name: 'Version Control', slug: 'version-control', letter: 'V', description: 'Git and other version control systems.', icon: 'Code', parentSlug: 'development' },
  ]

  for (const cat of categoriesData) {
    await db.orm.public.Category.upsert({
      conflictOn: { slug: cat.slug },
      update: { name: cat.name, letter: cat.letter, description: cat.description, icon: cat.icon, keywords: cat.keywords || '' },
      create: { name: cat.name, slug: cat.slug, letter: cat.letter, description: cat.description, icon: cat.icon, keywords: cat.keywords || '' },
    })
  }

  for (const cat of categoriesData) {
    if (cat.parentSlug) {
      const parent = await db.orm.public.Category.where({ slug: cat.parentSlug }).first()
      if (parent) await db.orm.public.Category.where({ slug: cat.slug }).update({ parentId: parent.id })
    }
  }

  const toolsData = [
    { name: 'Nmap', slug: 'nmap-tool', description: 'Network exploration tool and port scanner.', categorySlug: 'network-scanners' },
    { name: 'Wireshark', slug: 'wireshark', description: 'Network protocol analyzer.', categorySlug: 'packet-analyzers' },
    { name: 'tcpdump', slug: 'tcpdump', description: 'Command-line packet analyzer.', categorySlug: 'packet-analyzers' },
    { name: 'curl', slug: 'curl', description: 'Command-line tool for transferring data with URLs.', categorySlug: 'networking' },
    { name: 'wget', slug: 'wget', description: 'Network downloader.', categorySlug: 'networking' },
    { name: 'Nikto', slug: 'nikto', description: 'Web server scanner.', categorySlug: 'web-scanners' },
    { name: 'Metasploit', slug: 'metasploit', description: 'Penetration testing framework.', categorySlug: 'security' },
    { name: 'Autopsy', slug: 'autopsy', description: 'Digital forensics platform.', categorySlug: 'forensics' },
    { name: 'John the Ripper', slug: 'john', description: 'Password security auditing and cracking tool.', categorySlug: 'security' },
    { name: 'Hashcat', slug: 'hashcat', description: 'Advanced password recovery utility.', categorySlug: 'security' },
    { name: 'htop', slug: 'htop', description: 'Interactive process viewer.', categorySlug: 'monitoring' },
    { name: 'btop', slug: 'btop', description: 'Resource monitor with a modern UI.', categorySlug: 'monitoring' },
    { name: 'systemctl', slug: 'systemctl', description: 'Control the systemd system and service manager.', categorySlug: 'sysadmin' },
    { name: 'cron', slug: 'cron', description: 'Daemon to execute scheduled commands.', categorySlug: 'sysadmin' },
    { name: 'rsync', slug: 'rsync', description: 'Fast, versatile file copying tool.', categorySlug: 'sysadmin' },
    { name: 'Docker', slug: 'docker', description: 'Containerization platform.', categorySlug: 'sysadmin' },
    { name: 'Podman', slug: 'podman', description: 'Daemonless container engine.', categorySlug: 'sysadmin' },
    { name: 'Git', slug: 'git', description: 'Distributed version control system.', categorySlug: 'version-control' },
    { name: 'Vim', slug: 'vim', description: 'Highly configurable text editor.', categorySlug: 'text-editors' },
    { name: 'Neovim', slug: 'neovim', description: 'Vim-fork focused on extensibility and usability.', categorySlug: 'text-editors' },
    { name: 'Nano', slug: 'nano', description: 'Simple, user-friendly text editor.', categorySlug: 'text-editors' },
    { name: 'Visual Studio Code', slug: 'vscode-tool', description: 'Code editor redefined and optimized.', categorySlug: 'text-editors' },
    { name: 'Python', slug: 'python', description: 'High-level, interpreted programming language.', categorySlug: 'development' },
    { name: 'Node.js', slug: 'nodejs', description: 'JavaScript runtime.', categorySlug: 'development' },
    { name: 'GCC', slug: 'gcc', description: 'GNU Compiler Collection.', categorySlug: 'development' },
  ]

  for (const tool of toolsData) {
    const cat = await db.orm.public.Category.where({ slug: tool.categorySlug }).first()
    if (cat) {
      await db.orm.public.Tool.upsert({
        conflictOn: { slug: tool.slug },
        update: { name: tool.name, description: tool.description, categoryId: cat.id },
        create: { name: tool.name, slug: tool.slug, description: tool.description, categoryId: cat.id },
      })
    }
  }

  console.log('Seeding complete.')
}

main().then(() => db.close()).catch(async (error) => { console.error(error); await db.close(); process.exit(1); })
