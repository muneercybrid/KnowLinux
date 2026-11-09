import { getDb } from './db.js'

const db = getDb()

async function main() {
  console.log('Seeding database...')

  const categories = [
    { name: 'Linux Fundamentals', slug: 'linux-fundamentals', description: 'Core concepts, filesystem, and shell basics.', icon: 'Terminal' },
    { name: 'System Administration', slug: 'system-administration', description: 'Manage users, services, and processes.', icon: 'Server' },
    { name: 'Package Management', slug: 'package-management', description: 'APT, DNF, Pacman, and software repositories.', icon: 'Box' },
    { name: 'Networking', slug: 'networking', description: 'Network configuration, DNS, and diagnostics.', icon: 'Network' },
    { name: 'Development', slug: 'development', description: 'Compilers, version control, and environments.', icon: 'Code' },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Hardening, defensive security, and testing.', icon: 'Shield' },
    { name: 'Digital Forensics', slug: 'digital-forensics', description: 'Evidence acquisition and system analysis.', icon: 'Lock' },
    { name: 'Troubleshooting', slug: 'troubleshooting', description: 'Resolve errors, dependency conflicts, and boot issues.', icon: 'AlertTriangle' },
    { name: 'Desktop Linux', slug: 'desktop-linux', description: 'GUI, drivers, and desktop environments.', icon: 'Cpu' },
    { name: 'Storage & Filesystems', slug: 'storage-filesystems', description: 'Partitioning, LVM, and file system management.', icon: 'HardDrive' },
    { name: 'Databases', slug: 'databases', description: 'PostgreSQL, MySQL, and database administration.', icon: 'Database' },
    { name: 'Automation', slug: 'automation', description: 'Bash scripting, cron jobs, and Ansible.', icon: 'Wrench' },
  ]

  for (const cat of categories) {
    await db.orm.public.Category.upsert({
      conflictOn: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  const distros = [
    { name: 'Kali Linux', slug: 'kali', family: 'Debian', packageManager: 'apt' },
    { name: 'Ubuntu', slug: 'ubuntu', family: 'Debian', packageManager: 'apt' },
    { name: 'Debian', slug: 'debian', family: 'Debian', packageManager: 'apt' },
    { name: 'Arch Linux', slug: 'arch', family: 'Arch', packageManager: 'pacman' },
    { name: 'Fedora', slug: 'fedora', family: 'RHEL', packageManager: 'dnf' },
  ]

  for (const distro of distros) {
    await db.orm.public.Distribution.upsert({
      conflictOn: { slug: distro.slug },
      update: {},
      create: distro,
    })
  }

  const softwareData = [
    { name: 'Docker', slug: 'docker', description: 'Containerization platform for building and running applications.', category: 'DevOps', commands: { kali: 'sudo apt install docker.io', ubuntu: 'sudo apt install docker.io', debian: 'sudo apt install docker.io', arch: 'sudo pacman -S docker', fedora: 'sudo dnf install docker' } },
    { name: 'Visual Studio Code', slug: 'vscode', description: 'Code editor redefined and optimized for building and debugging modern web and cloud applications.', category: 'Development', commands: { kali: 'sudo apt install code', ubuntu: 'sudo snap install code --classic', debian: 'sudo apt install code', arch: 'sudo pacman -S code', fedora: 'sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc && sudo dnf install code' } },
    { name: 'Git', slug: 'git', description: 'Free and open source distributed version control system.', category: 'Development', commands: { kali: 'sudo apt install git', ubuntu: 'sudo apt install git', debian: 'sudo apt install git', arch: 'sudo pacman -S git', fedora: 'sudo dnf install git' } },
  ]

  for (const soft of softwareData) {
    const createdSoft = await db.orm.public.Software.upsert({
      conflictOn: { slug: soft.slug },
      update: {},
      create: {
        name: soft.name,
        slug: soft.slug,
        description: soft.description,
        category: soft.category,
        isVerified: true
      }
    })

    for (const [distroSlug, command] of Object.entries(soft.commands)) {
      const distro = await db.orm.public.Distribution.where({ slug: distroSlug }).first()
      if (distro) {
        await db.orm.public.SoftwareDistribution.upsert({
          conflictOn: {
            softwareId: createdSoft.id,
            distributionId: distro.id
          },
          update: { installCommand: command },
          create: {
            softwareId: createdSoft.id,
            distributionId: distro.id,
            installCommand: command
          }
        })
      }
    }
  }

  const commandsData = [
    { name: 'ls', slug: 'ls', description: 'List directory contents.', syntax: 'ls [OPTION]... [FILE]...', category: 'Filesystem', examples: JSON.stringify([{ desc: 'List all files including hidden', cmd: 'ls -la' }, { desc: 'List files sorted by size', cmd: 'ls -lhS' }]) },
    { name: 'grep', slug: 'grep', description: 'Search for patterns in files or standard input.', syntax: 'grep [OPTION]... PATTERNS [FILE]...', category: 'Text Processing', examples: JSON.stringify([{ desc: 'Search for a word in a file', cmd: 'grep "error" /var/log/syslog' }, { desc: 'Case-insensitive search', cmd: 'grep -i "warning" app.log' }]) },
    { name: 'chmod', slug: 'chmod', description: 'Change file mode bits (permissions).', syntax: 'chmod [OPTION]... MODE[,MODE]... FILE...', category: 'Permissions', examples: JSON.stringify([{ desc: 'Give execute permission to user', cmd: 'chmod +x script.sh' }, { desc: 'Set specific permissions (read/write for owner, read for others)', cmd: 'chmod 644 document.txt' }]) },
    { name: 'systemctl', slug: 'systemctl', description: 'Control the systemd system and service manager.', syntax: 'systemctl [OPTIONS...] COMMAND [UNIT...]', category: 'System Administration', examples: JSON.stringify([{ desc: 'Start a service', cmd: 'sudo systemctl start nginx' }, { desc: 'Check service status', cmd: 'systemctl status ssh' }]) },
    { name: 'nmap', slug: 'nmap', description: 'Network exploration tool and security / port scanner.', syntax: 'nmap [Scan Type...] [Options] {target specification}', category: 'Networking', examples: JSON.stringify([{ desc: 'Scan for open ports on a target', cmd: 'nmap -sV 192.168.1.1' }, { desc: 'Ping scan to discover hosts', cmd: 'nmap -sn 192.168.1.0/24' }]) },
  ]

  for (const cmd of commandsData) {
    await db.orm.public.Command.upsert({
      conflictOn: { slug: cmd.slug },
      update: {},
      create: cmd,
    })
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
