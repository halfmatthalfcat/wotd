import {
  Button,
  Center,
  Code,
  Container,
  createStyles,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title
} from "@mantine/core";
import Image from "next/image";
import { IconPlus } from "@tabler/icons";
import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { Prism } from "@mantine/prism";
import Link from "next/link";

const useStyles = createStyles(() => ({
  discord: {
    color: "#7289da",
  },
  addButton: {
    backgroundColor: "#7289da",
  },
  link: {
    color: "inherit",
    textDecoration: "unset",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}))

const Home = () => {
  const { classes } = useStyles();
  const plausible = usePlausible();
  const router = useRouter();
  return (
    <Container p={20}>
      <Stack>
        <Center>
          <Group>
            <Paper>
              <Image
                src="/discord.png"
                alt="discord logo"
                width={94}
                height={72}
              />
            </Paper>
            <IconPlus size={30} />
            <Paper withBorder={true} radius={64} shadow="xs">
              <Image
                src="/WotD.png"
                alt="word of the day logo"
                width={100}
                height={100}
              />
            </Paper>
          </Group>
        </Center>
        <Center>
          <Stack>
            <Center>
              <Title><Text component="span" className={classes.discord}>Discord</Text> Word of the Day Bot</Title>
            </Center>
            <Center>
              <Text italic={true}>Get a daily Word of the Day directly to your Discord guild</Text>
            </Center>
            <Button
              className={classes.addButton}
              onClick={() => {
                plausible("install");
                router.push(
                  "https://discord.com/api/oauth2/authorize?client_id=1062042420700790945&permissions=2048&scope=bot%20applications.commands"
                );
              }}
            >
              Add To Your Guild
            </Button>
            <Center>
              <Stack spacing={0}>
                <Center>
                  <Text italic={true}>Choose Between</Text>
                </Center>
                <Group>
                  <Image
                    src="/mw.png"
                    alt="merriam-webster logo"
                    height={128}
                    width={128}
                  />
                  <Divider orientation="vertical" />
                  <Image
                    src="/ud.png"
                    alt="urban dictionary logo"
                    height={40}
                    width={128}
                  />
                </Group>
              </Stack>
            </Center>
          </Stack>
        </Center>
        <Divider />
        <Stack>
          <Title order={3} italic={true}>Slash Commands</Title>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Initial Setup</Title>
              <Text italic={true} size={12}>Upon install, use <Code>/setup</Code> to activate WotD bot.</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/setup [channel] [time] [tz] [dictionary]</Prism>
          </SimpleGrid>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Set channel</Title>
              <Text italic={true} size={12}>Set the channel to fire the WotD into.</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/channel [channel]</Prism>
          </SimpleGrid>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Set time</Title>
              <Text italic={true} size={12}>Set the hour (0-23) at which to fire the WotD.</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/time [time]</Prism>
          </SimpleGrid>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Set timezone</Title>
              <Text italic={true} size={12}>Set the timezone to fire the WotD in.</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/tz [tz]</Prism>
          </SimpleGrid>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Set dictionary</Title>
              <Text italic={true} size={12}>Set the dictionary to use for WotD.</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/dictionary [dictionary]</Prism>
          </SimpleGrid>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { maxWidth: "sm", cols: 1 },
            ]}
          >
            <Stack spacing={0}>
              <Title order={5}>Manually fire the WotD</Title>
              <Text italic={true} size={12}>Tell WotD bot to post the WotD to your active channel, any time!</Text>
            </Stack>
            <Prism language="bash" noCopy={true}>/wotd</Prism>
          </SimpleGrid>
        </Stack>
      </Stack>
      <Divider mt={10} mb={10} />
      <Center>
        <Text>Created by <Link href="https://halfmatthalfcat.com" className={classes.link}>halfmatthalfcat</Link></Text>
      </Center>
    </Container>
  )
};

export default Home;
