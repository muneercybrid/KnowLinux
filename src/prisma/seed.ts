import { getDb } from './db.js'

const db = getDb()

async function main() {
  console.log('Seeding database...')

  // 1. Seed A-Z Categories
  const categories = [
    { name: 'Administration', slug: 'administration', letter: 'A', description: 'System administration tools and utilities.', icon: 'Server', keywords: 'sysadmin, root, manage' },
    { name: 'Automation', slug: 'automation', letter: 'A', description: 'Tools for scripting, cron jobs, and workflows.', icon: 'Wrench', keywords: 'ansible, cron, script' },
    { name: 'Backup', slug: 'backup', letter: 'B', description: 'Data backup and restoration software.', icon: 'Database', keywords: 'rsync, restore, archive' },
    { name: 'Browsers', slug: 'browsers', letter: 'B', description: 'Web browsers for Linux.', icon: 'Network', keywords: 'firefox, chrome, web' },
    { name: 'Communication', slug: 'communication', letter: 'C', description: 'Messaging, email, and VoIP applications.', icon: 'Terminal', keywords: 'slack, discord, email' },
    { name: 'Containers', slug: 'containers', letter: 'C', description: 'Containerization and virtualization tools.', icon: 'Box', keywords: 'docker, podman, k8s' },
    { name: 'Cybersecurity', slug: 'cybersecurity', letter: 'C', description: 'Security, pentesting, and defensive tools.', icon: 'Shield', keywords: 'security, hacking, pentest' },
    { name: 'Databases', slug: 'databases', letter: 'D', description: 'Database management systems and clients.', icon: 'Database', keywords: 'sql, postgres, mysql' },
    { name: 'Development', slug: 'development', letter: 'D', description: 'IDEs, compilers, and programming tools.', icon: 'Code', keywords: 'code, ide, compiler' },
    { name: 'Digital Forensics', slug: 'digital-forensics', letter: 'D', description: 'Evidence acquisition and system analysis.', icon: 'Lock', keywords: 'forensics, evidence' },
    { name: 'Education', slug: 'education', letter: 'E', description: 'Learning and educational software.', icon: 'BookOpen', keywords: 'learn, teach' },
    { name: 'Emulation', slug: 'emulation', letter: 'E', description: 'Emulators for games and operating systems.', icon: 'Cpu', keywords: 'wine, retroarch' },
    { name: 'File Management', slug: 'file-management', letter: 'F', description: 'File managers and utilities.', icon: 'HardDrive', keywords: 'files, copy, move' },
    { name: 'Graphics', slug: 'graphics', letter: 'G', description: 'Image editing, 3D modeling, and design.', icon: 'Code', keywords: 'gimp, blender, design' },
    { name: 'Hardware', slug: 'hardware', letter: 'H', description: 'Drivers, firmware, and hardware diagnostics.', icon: 'Cpu', keywords: 'drivers, hardware' },
    { name: 'Networking', slug: 'networking', letter: 'N', description: 'Network configuration, DNS, and diagnostics.', icon: 'Network', keywords: 'wireshark, nmap, ping' },
    { name: 'Office', slug: 'office', letter: 'O', description: 'Word processors, spreadsheets, and productivity.', icon: 'BookOpen', keywords: 'libreoffice, word' },
    { name: 'Package Management', slug: 'package-management', letter: 'P', description: 'APT, DNF, Pacman, and software repositories.', icon: 'Box', keywords: 'apt, dnf, pacman' },
    { name: 'Security', slug: 'security', letter: 'S', description: 'Firewalls, encryption, and hardening.', icon: 'Shield', keywords: 'firewall, encrypt' },
    { name: 'Storage', slug: 'storage', letter: 'S', description: 'Partitioning, LVM, and file systems.', icon: 'HardDrive', keywords: 'disk, partition, lvm' },
    { name: 'System Monitoring', slug: 'system-monitoring', letter: 'S', description: 'System resource and performance monitoring.', icon: 'Server', keywords: 'htop, netdata' },
    { name: 'Terminal', slug: 'terminal', letter: 'T', description: 'Terminal emulators and multiplexers.', icon: 'Terminal', keywords: 'bash, zsh, tmux' },
    { name: 'Text Editors', slug: 'text-editors', letter: 'T', description: 'Code and text editors.', icon: 'Code', keywords: 'vim, nano, vscode' },
    { name: 'Troubleshooting', slug: 'troubleshooting', letter: 'T', description: 'Resolve errors, dependency conflicts, and boot issues.', icon: 'AlertTriangle', keywords: 'fix, error, repair' },
    { name: 'Virtualization', slug: 'virtualization', letter: 'V', description: 'Hypervisors and virtual machine managers.', icon: 'Server', keywords: 'kvm, virtualbox' },
    { name: 'Web Servers', slug: 'web-servers', letter: 'W', description: 'HTTP servers and reverse proxies.', icon: 'Network', keywords: 'nginx, apache' },
  ]

  for (const cat of categories) {
    await db.orm.public.Category.upsert({
      conflictOn: { slug: cat.slug },
      update: { letter: cat.letter, keywords: cat.keywords },
      create: cat,
    })
  }

  // 2. Seed Software (Keep existing)
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

  // 3. Seed Commands (Keep existing)
  const commandsData = [
    { name: 'ls', slug: 'ls', description: 'List directory contents.', syntax: 'ls [OPTION]... [FILE]...', category: 'Filesystem', examples: JSON.stringify([{ desc: 'List all files including hidden', cmd: 'ls -la' }]), parameters: JSON.stringify([]) },
    { name: 'grep', slug: 'grep', description: 'Search for patterns in files or standard input.', syntax: 'grep [OPTION]... PATTERNS [FILE]...', category: 'Text Processing', examples: JSON.stringify([{ desc: 'Search for a word in a file', cmd: 'grep "error" /var/log/syslog' }]), parameters: JSON.stringify([]) },
    { name: 'nmap', slug: 'nmap', description: 'Network exploration tool and security / port scanner.', syntax: 'nmap [Scan Type...] [Options] {target specification}', category: 'Networking', examples: JSON.stringify([{ desc: 'Scan for open ports on a target', cmd: 'nmap -sV 192.168.1.1' }]), parameters: JSON.stringify([]) },
  ]

  for (const cmd of commandsData) {
    await db.orm.public.Command.upsert({
      conflictOn: { slug: cmd.slug },
      update: { parameters: cmd.parameters },
      create: cmd,
    })
  }

  // 4. Seed Troubleshooting (Keep existing)
  const fixesData = [
    { title: 'Could not get lock /var/lib/dpkg/lock-frontend', slug: 'apt-lock-error', errorSignature: 'Could not get lock /var/lib/dpkg/lock-frontend. It is held by process', explanation: 'This happens when the APT package manager is already running in the background.', causes: JSON.stringify(['Another apt process is running.']), diagnostics: JSON.stringify(['ps aux | grep -i apt']), fixes: JSON.stringify(['Wait for the process to finish.', 'sudo rm /var/lib/dpkg/lock-frontend']), verification: 'Run apt update.' },
    { title: 'Permission denied (publickey)', slug: 'ssh-permission-denied', errorSignature: 'Permission denied (publickey)', explanation: 'SSH rejected your connection because the public key does not match.', causes: JSON.stringify(['Wrong key.', 'Wrong permissions.']), diagnostics: JSON.stringify(['ssh -vvv user@host']), fixes: JSON.stringify(['ssh-copy-id user@host']), verification: 'SSH again.' },
    { title: 'Command not found', slug: 'command-not-found', errorSignature: 'bash: command: command not found', explanation: 'The shell cannot locate the executable for the command you typed.', causes: JSON.stringify(['Software not installed.', 'PATH is wrong.']), diagnostics: JSON.stringify(['which command_name']), fixes: JSON.stringify(['sudo apt install <package-name>']), verification: 'Run command.' },
    { title: 'Job for nginx.service failed because the control process exited with error code', slug: 'systemd-service-failed', errorSignature: 'Job for nginx.service failed because the control process exited with error code', explanation: 'A Systemd service failed to start.', causes: JSON.stringify(['Syntax error in config.', 'Port conflict.']), diagnostics: JSON.stringify(['systemctl status nginx', 'journalctl -xeu nginx.service']), fixes: JSON.stringify(['Fix config.', 'systemctl restart nginx']), verification: 'systemctl status nginx.' },
    { title: 'No space left on device', slug: 'no-space-left', errorSignature: 'No space left on device', explanation: 'The disk is full.', causes: JSON.stringify(['Logs filling up.', 'Large files.']), diagnostics: JSON.stringify(['df -h', 'du -sh /*']), fixes: JSON.stringify(['sudo apt clean', 'rm large files']), verification: 'df -h.' }
  ];

  for (const fix of fixesData) {
    await db.orm.public.TroubleshootingCase.upsert({
      conflictOn: { slug: fix.slug },
      update: {},
      create: fix,
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
