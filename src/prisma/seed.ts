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
      where: { slug: cat.slug },
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
      where: { slug: distro.slug },
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
      where: { slug: soft.slug },
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
          where: {
            softwareId_distributionId: {
              softwareId: createdSoft.id,
              distributionId: distro.id
            }
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

  console.log('Seeding complete.')
}

main()
  .then(() => db.close())
  .catch(async (error) => {
    console.error(error)
    await db.close()
    process.exit(1)
  })
