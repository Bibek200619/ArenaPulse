import { sportsService } from '@/services/sports/service';
import { EntityList } from '@/components/sports/entity-list';
export const metadata = { title: 'Competitions' };
export default async function Page() {
  const { data, provenance } = await sportsService.getCatalog();
  return (
    <EntityList
      title="Competitions"
      description="Find your next matchday."
      source={provenance.label}
      items={data.competitions.map((entity) => ({
        id: entity.id,
        name: entity.name,
        description:
          data.sports.find((sport) => sport.id === entity.sportId)?.name ??
          'Sport unavailable',
        href: `/competitions/${entity.id}`,
        badge: entity.name
          .split(' ')
          .map((word) => word[0])
          .slice(0, 2)
          .join(''),
      }))}
    />
  );
}
