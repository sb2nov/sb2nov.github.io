---
layout: post
title: "Upsert Backups with rsync"
date: 2016-05-22 00:46:31
---

We all know the importance of taking backups. I have run into a few machine failures in the past and they always seem to occur when you least expect them. Currently Mac comes with a backup program called Time Machine which automatically takes backup of your disk to an external drive. But some of its features have issues that I would like to highlight:

- You need to get a separate external hard drive that can only be used for Time Machine. Although you can get around this by [partitioning](http://osxdaily.com/2013/05/01/use-single-hard-drive-time-machine-and-file-storage/) the external drive into multiple partitions.
- This external drive needs to be formatted in MacOs Journaled file format, which makes it harder to be used on Windows/Linux.
- You cannot make a list of things you want to have backed up, you can only exclude folders from your complete hard disk
- Time Machine makes an exact copy of your hard drive.

The points listed above are not huge blockers by any means and are perfectly fine choices on Time Machine’s part. Still the last one had been a growing pain for me as SSDs are much smaller in size compared to HDDs unless you have a lot of $$ to shell out.

Let’s say you have a 1 TB external drive and your Mac has 128GB of disk space. You transfer 50 GB of music/videos/data to your external drive and delete it from your local disk to create space. The problem with this approach is that the next time you run backup,  those files would be deleted from the external disk also, as they are no longer present on your local disk. This can be really frustrating if you want the new data to be merged into your old copy on the backup drive instead of wiping out the old data.

The solution I ended up settling on was to use the `rsync` [command line utility](http://linux.die.net/man/1/rsync) on Unix to backup. The basic syntax for using rsync is very simple: `rsync OPTIONS SOURCE DESTINATION`.

So if you want to backup your Documents directory on to the external drive.

`rsync -a --progress --exclude '*.DS_Store' ~/Documents /Volumes/Seagate/`

Here the first flag `-a` means Archive which does exactly what we want, the second `--progress` is used to provide  additional feedback to us when the job is running. The exclude statements just filter files that we don’t want being transferred to our backup drive such as the `.DS_Store` files that mac creates in directories. Finally, we have the source and destination paths.

I ended up creating a new function in my `~/.zshrc` (`~/.bashrc` if you use bash) to help with backing up the different directories I wanted. This can directly be invoked up typing backupDisk in the terminal.

```sh
function backupDisk() {
    rsync -a --progress --exclude '*.DS_Store' ~/Acads /Volumes/Seagate/
    rsync -a --progress --exclude '*.DS_Store' ~/Music /Volumes/Seagate/
    rsync -a --progress --exclude '*.DS_Store' ~/Photos /Volumes/Seagate/
    rsync -a --progress --exclude '*.DS_Store' ~/Videos /Volumes/Seagate/
}
```

PS: I started using this trick in school when online storage was way more expensive compared to external drives. You can also use one of the cloud storage providers as an alternative. I use Google Drive for most of my documents.
