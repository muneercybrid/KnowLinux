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
    { name: 'ls', slug: 'ls', description: 'List directory contents.', syntax: 'ls [OPTION]... [FILE]...', category: 'Filesystem', examples: JSON.stringify([{ desc: 'List all files including hidden', cmd: 'ls -la' }]), parameters: JSON.stringify([]) },
    { name: 'grep', slug: 'grep', description: 'Search for patterns in files or standard input.', syntax: 'grep [OPTION]... PATTERNS [FILE]...', category: 'Text Processing', examples: JSON.stringify([{ desc: 'Search for a word in a file', cmd: 'grep "error" /var/log/syslog' }]), parameters: JSON.stringify([{ name: 'pattern', label: 'Search Pattern', type: 'text', placeholder: 'e.g., error', required: true, flag: '' }, { name: 'file', label: 'Target File', type: 'text', placeholder: 'e.g., /var/log/syslog', required: true, flag: '' }]) },
    { name: 'nmap', slug: 'nmap', description: 'Network exploration tool and security / port scanner.', syntax: 'nmap [Scan Type...] [Options] {target specification}', category: 'Networking', examples: JSON.stringify([{ desc: 'Scan for open ports on a target', cmd: 'nmap -sV 192.168.1.1' }]), parameters: JSON.stringify([{ name: 'target', label: 'Target IP / Hostname', type: 'text', placeholder: 'e.g., 192.168.1.1', required: true, flag: '' }, { name: 'version', label: 'Service Version Detection (-sV)', type: 'boolean', required: false, flag: '-sV' }]) },
  ]

  for (const cmd of commandsData) {
    await db.orm.public.Command.upsert({
      conflictOn: { slug: cmd.slug },
      update: { parameters: cmd.parameters },
      create: cmd,
    })
  }

  // --- Troubleshooting Cases ---
  const fixesData = [
    {
      title: 'Could not get lock /var/lib/dpkg/lock-frontend',
      slug: 'apt-lock-error',
      errorSignature: 'Could not get lock /var/lib/dpkg/lock-frontend. It is held by process',
      explanation: 'This happens when the APT package manager is already running in the background (e.g., automatic updates or another terminal). Linux uses lock files to prevent multiple processes from modifying packages simultaneously.',
      causes: JSON.stringify(['Another apt/dpkg process is running in another terminal.', 'An unattended upgrade is running in the background.', 'A previous apt process crashed and left a stale lock file.']),
      diagnostics: JSON.stringify(['ps aux | grep -i apt', 'sudo lsof /var/lib/dpkg/lock-frontend']),
      fixes: JSON.stringify(['Wait for the background process to finish.', 'If no process is running, remove the stale locks: sudo rm /var/lib/dpkg/lock-frontend', 'Reconfigure packages: sudo dpkg --configure -a']),
      verification: 'Run "sudo apt update" to ensure it completes without lock errors.'
    },
    {
      title: 'Permission denied (publickey)',
      slug: 'ssh-permission-denied',
      errorSignature: 'Permission denied (publickey)',
      explanation: 'This SSH error means the server rejected your connection because the public key presented by your client does not match any authorized keys on the server, or the server is configured to reject password authentication.',
      causes: JSON.stringify(['The public key is not in ~/.ssh/authorized_keys on the server.', 'Incorrect file permissions on the server (authorized_keys must be 600, .ssh must be 700).', 'Wrong username.', 'SSH server configuration disallows the authentication method.']),
      diagnostics: JSON.stringify(['ssh -vvv user@hostname', 'Check server logs: sudo tail -f /var/log/auth.log']),
      fixes: JSON.stringify(['Ensure your public key is copied to the server: ssh-copy-id user@hostname', 'Fix permissions on the server: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys']),
      verification: 'Attempt to SSH again: ssh user@hostname'
    },
    {
      title: 'Command not found',
      slug: 'command-not-found',
      errorSignature: 'bash: command: command not found',
      explanation: 'The shell cannot locate the executable for the command you typed. This usually means the program is not installed, or it is installed in a directory not included in your PATH environment variable.',
      causes: JSON.stringify(['The software package is not installed.', 'The binary is outside the PATH.', 'Typo in the command name.']),
      diagnostics: JSON.stringify(['which command_name', 'echo $PATH', 'dpkg -l | grep command_name (Debian/Ubuntu)']),
      fixes: JSON.stringify(['Install the package: sudo apt install <package-name>', 'If installed, find its path: find / -name "command_name" 2>/dev/null', 'Add the path to PATH: export PATH=$PATH:/new/path']),
      verification: 'Run the command again to see if it executes.'
    },
    {
      title: 'Job for nginx.service failed because the control process exited with error code',
      slug: 'systemd-service-failed',
      errorSignature: 'Job for nginx.service failed because the control process exited with error code',
      explanation: 'A Systemd service failed to start. This could be due to a syntax error in its configuration file, port conflict, or missing dependencies.',
      causes: JSON.stringify(['Syntax error in the configuration file.', 'The port the service wants to use is already in use.', 'Missing required files or directories.']),
      diagnostics: JSON.stringify(['systemctl status nginx', 'journalctl -xeu nginx.service', 'nginx -t']),
      fixes: JSON.stringify(['Fix the configuration error reported in the logs.', 'Check for port conflicts: ss -tulpn | grep :80', 'Restart the service: sudo systemctl restart nginx']),
      verification: 'systemctl status nginx should show "active (running)".'
    },
    {
      title: 'No space left on device',
      slug: 'no-space-left',
      errorSignature: 'No space left on device',
      explanation: 'The disk or partition where the system is trying to write data has run out of available storage space.',
      causes: JSON.stringify(['Large log files filling up /var/log.', 'Downloaded files or packages using too much space.', 'Deleted files still held open by running processes.', 'Inodes have been exhausted.']),
      diagnostics: JSON.stringify(['df -h', 'du -sh /* | sort -hr | head -10', 'df -i']),
      fixes: JSON.stringify(['Clear package cache: sudo apt clean', 'Remove old kernels (Debian/Ubuntu): sudo apt autoremove --purge', 'Truncate large log files: sudo truncate -s 0 /var/log/largefile.log', 'Find deleted but open files: sudo lsof / | grep deleted']),
      verification: 'Run df -h again to confirm space has been freed.'
    }
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
