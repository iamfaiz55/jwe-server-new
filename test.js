<NavDropdown title={item.menuitem} show>
{item.children.map((submenu, submenuindex) => {
    return <>
        <h4 className="dropdown-header" key={submenuindex}>

            {item.header}


        </h4>


        <NavDropdown.Item
            key={submenuindex}
            as={Link}
            to={submenu.link}
            onClick={(expandedMenu) => onClick(!expandedMenu)}
        >
            {/* Second level menu item without having sub menu items */}
            {submenu.menuitem}
            {submenu.badge && (
                <Badge
                    className="ms-1"
                    bg={submenu.badgecolor ? submenu.badgecolor : 'primary'}
                >
                    {submenu.badge}
                </Badge>
            )}
        </NavDropdown.Item>




    </>
})}
</NavDropdown >